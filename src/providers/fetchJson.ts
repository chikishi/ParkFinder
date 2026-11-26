import { ProviderError } from '@/providers/types';

/** 混雑を表す HTTP ステータス */
const BUSY_STATUSES = new Set([429, 502, 503, 504]);

type FetchJsonOptions = {
  init?: RequestInit;
  signal?: AbortSignal;
  timeoutMs: number;
};

/**
 * JSON を取得する。失敗の種類に応じた ProviderError を投げる。
 * 呼び出し元による中断（aborted）とタイムアウト（timeout）を区別する。
 */
export async function fetchJson(url: string, options: FetchJsonOptions): Promise<unknown> {
  const { init, signal, timeoutMs } = options;
  if (signal?.aborted) {
    throw new ProviderError('aborted', '通信が中断されました');
  }

  const controller = new AbortController();
  let isTimedOut = false;
  const timer = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, timeoutMs);
  const handleAbort = () => controller.abort();
  signal?.addEventListener('abort', handleAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (isTimedOut) {
        throw new ProviderError('timeout', '通信がタイムアウトしました', { cause: error });
      }
      if (controller.signal.aborted) {
        throw new ProviderError('aborted', '通信が中断されました', { cause: error });
      }
      throw new ProviderError('network', '通信に失敗しました', { cause: error });
    }

    // 混雑時は 429（リクエスト過多）、502・503（一時的な停止）、504（処理待ちのタイムアウト）が返る
    if (BUSY_STATUSES.has(response.status)) {
      throw new ProviderError('rate-limit', `混雑により拒否されました（HTTP ${response.status}）`);
    }
    if (!response.ok) {
      throw new ProviderError('network', `通信に失敗しました（HTTP ${response.status}）`);
    }

    try {
      return await response.json();
    } catch (error) {
      if (isTimedOut) {
        throw new ProviderError('timeout', '通信がタイムアウトしました', { cause: error });
      }
      if (controller.signal.aborted) {
        throw new ProviderError('aborted', '通信が中断されました', { cause: error });
      }
      throw new ProviderError('invalid-response', '応答の形式が不正です', { cause: error });
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', handleAbort);
  }
}
