import type { LatLng, ParkingLot } from '@/types/domain';

type CacheEntry = { savedAt: number; parkingLots: ParkingLot[] };

type SearchCacheOptions = {
  ttlMs?: number;
  maxEntries?: number;
  /** 現在時刻（ミリ秒）の取得処理。テストで差し替える */
  now?: () => number;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 50;

/** 中心座標を小数点以下 4 桁（約 10m）に丸め、ほぼ同じ地点の検索を同じキーにまとめる */
export function toCacheKey(center: LatLng, radiusM: number): string {
  return `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${radiusM}`;
}

/** 周辺検索の結果をメモリ上に一時保存する */
export class SearchCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: SearchCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.now = options.now ?? Date.now;
  }

  get(center: LatLng, radiusM: number): ParkingLot[] | undefined {
    const key = toCacheKey(center, radiusM);
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (this.now() - entry.savedAt >= this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.parkingLots;
  }

  set(center: LatLng, radiusM: number, parkingLots: ParkingLot[]): void {
    const key = toCacheKey(center, radiusM);
    // Map は挿入順を保つため、再保存時は一度削除して末尾（最新）に移す
    this.entries.delete(key);
    this.entries.set(key, { savedAt: this.now(), parkingLots });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.entries.delete(oldestKey);
    }
  }

  get size(): number {
    return this.entries.size;
  }
}
