import { ProviderError } from '@/providers/types';

type RequestThrottleOptions = {
  minIntervalMs?: number;
  /** 現在時刻（ミリ秒）の取得処理。テストで差し替える */
  now?: () => number;
};

const DEFAULT_MIN_INTERVAL_MS = 1000;

/**
 * 外部 API の呼び出し間隔を一定以上あける。
 * Overpass・Nominatim の利用ポリシー（おおむね 1 秒に 1 回まで）を守るために使う。
 */
export class RequestThrottle {
  private readonly minIntervalMs: number;
  private readonly now: () => number;
  private nextAvailableAt = 0;

  constructor(options: RequestThrottleOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    this.now = options.now ?? Date.now;
  }

  /** 直前の呼び出しから間隔が空くまで待ってから、処理を実行する */
  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    // 待機中に次の呼び出しが来ても間隔が保たれるよう、実行予定時刻を先に予約する
    const scheduledAt = Math.max(this.now(), this.nextAvailableAt);
    this.nextAvailableAt = scheduledAt + this.minIntervalMs;

    await waitUntil(scheduledAt - this.now(), signal);
    return task();
  }
}

function waitUntil(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new ProviderError('aborted', '通信が中断されました');
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    if (delayMs <= 0) {
      resolve();
      return;
    }
    const handleAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}
