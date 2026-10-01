import type { ParkingProvider } from '@/providers/types';
import type { SearchCache } from '@/services/searchCache';
import type { RequestThrottle } from '@/services/requestThrottle';
import type { LatLng, ParkingLot, ParkingSearchResult } from '@/types/domain';
import { calcDistanceM } from '@/utils/distance';

/** 一般利用できない駐車場を示す access タグの値 */
const RESTRICTED_ACCESS = new Set(['private', 'no']);

export function isPubliclyAccessible(parkingLot: ParkingLot): boolean {
  return parkingLot.access === undefined || !RESTRICTED_ACCESS.has(parkingLot.access);
}

/** 利用できない駐車場を除外し、検索中心からの距離を付けて近い順に並べる */
export function toSearchResults(parkingLots: ParkingLot[], center: LatLng): ParkingSearchResult[] {
  return parkingLots
    .filter(isPubliclyAccessible)
    .map((parkingLot) => ({ ...parkingLot, distanceM: calcDistanceM(center, parkingLot.location) }))
    .sort((a, b) => a.distanceM - b.distanceM || a.id.localeCompare(b.id));
}

type ParkingSearchServiceDeps = {
  provider: ParkingProvider;
  cache: SearchCache;
  throttle: RequestThrottle;
};

export class ParkingSearchService {
  private readonly deps: ParkingSearchServiceDeps;

  constructor(deps: ParkingSearchServiceDeps) {
    this.deps = deps;
  }

  async search(
    center: LatLng,
    radiusM: number,
    signal?: AbortSignal,
  ): Promise<ParkingSearchResult[]> {
    const { provider, cache, throttle } = this.deps;

    let parkingLots = cache.get(center, radiusM);
    if (parkingLots === undefined) {
      parkingLots = await throttle.run(
        () => provider.searchNearby(center, radiusM, signal),
        signal,
      );
      // フィルタ前の結果を保存し、フィルタ条件が変わってもキャッシュを使えるようにする
      cache.set(center, radiusM, parkingLots);
    }
    return toSearchResults(parkingLots, center);
  }
}
