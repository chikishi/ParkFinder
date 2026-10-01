/** localStorage のキーの接頭辞。データ形式を変えるときはバージョンを上げて移行処理を入れる */
export const STORAGE_PREFIX = 'parkfinder:v1:';

function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    // プライベートブラウズや設定によっては localStorage へのアクセス自体が例外になる
    return undefined;
  }
}

/**
 * JSON として保存された値を読み込む。
 * 値が無い・壊れている・型が合わない場合は fallback を返し、アプリを停止させない。
 */
export function readJson<T>(key: string, guard: (value: unknown) => value is T, fallback: T): T {
  const storage = getStorage();
  if (storage === undefined) {
    return fallback;
  }
  try {
    const text = storage.getItem(STORAGE_PREFIX + key);
    if (text === null) {
      return fallback;
    }
    const value: unknown = JSON.parse(text);
    return guard(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** 値を JSON にして保存する。容量超過などで失敗した場合は false を返す */
export function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (storage === undefined) {
    return false;
  }
  try {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
