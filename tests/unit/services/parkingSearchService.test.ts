import { describe, expect, it, vi } from 'vitest';
import type { ParkingProvider } from '@/providers/types';
import {
  ParkingSearchService,
  isPubliclyAccessible,
  toSearchResults,
} from '@/services/parkingSearchService';
import { RequestThrottle } from '@/services/requestThrottle';
import { SearchCache } from '@/services/searchCache';
import type { LatLng, ParkingLot } from '@/types/domain';
import { calcDistanceM } from '@/utils/distance';

const CENTER = { lat: 34.393885, lng: 131.401059 };

const parkingLot = (id: string, location: LatLng, access?: string): ParkingLot => ({
  id,
  source: 'osm',
  location,
  parkingType: 'unknown',
  fee: 'unknown',
  access,
});

const FAR = parkingLot('far', { lat: 34.3975, lng: 131.401059 });
const NEAR = parkingLot('near', { lat: 34.3945, lng: 131.401059 });
const PRIVATE = parkingLot('private', { lat: 34.394, lng: 131.401059 }, 'private');
const NO_ACCESS = parkingLot('no', { lat: 34.394, lng: 131.401059 }, 'no');
const CUSTOMERS = parkingLot('customers', { lat: 34.396, lng: 131.401059 }, 'customers');

function createService(parkingLots: ParkingLot[]) {
  const provider: ParkingProvider = {
    searchNearby: vi.fn(async () => parkingLots),
  };
  const service = new ParkingSearchService({
    provider,
    cache: new SearchCache(),
    throttle: new RequestThrottle({ minIntervalMs: 0 }),
  });
  return { service, provider };
}

describe('isPubliclyAccessible', () => {
  it('access=private・access=no の駐車場は一般利用できない', () => {
    expect(isPubliclyAccessible(PRIVATE)).toBe(false);
    expect(isPubliclyAccessible(NO_ACCESS)).toBe(false);
  });

  it('access が無い、またはそれ以外の値の駐車場は一般利用できる', () => {
    expect(isPubliclyAccessible(NEAR)).toBe(true);
    expect(isPubliclyAccessible(CUSTOMERS)).toBe(true);
  });
});

describe('toSearchResults', () => {
  it('結果が距離の昇順に並ぶ', () => {
    const results = toSearchResults([FAR, CUSTOMERS, NEAR], CENTER);

    expect(results.map((result) => result.id)).toEqual(['near', 'customers', 'far']);
  });

  it('access=private の駐車場は除外される', () => {
    const results = toSearchResults([PRIVATE, NEAR, NO_ACCESS], CENTER);

    expect(results.map((result) => result.id)).toEqual(['near']);
  });

  it('検索中心からの距離（m）が付与される', () => {
    const [result] = toSearchResults([NEAR], CENTER);

    expect(result?.distanceM).toBe(68);
  });

  it('距離が同じ場合は ID 順に並ぶ', () => {
    const b = parkingLot('b', NEAR.location);
    const a = parkingLot('a', NEAR.location);

    expect(toSearchResults([b, a], CENTER).map((result) => result.id)).toEqual(['a', 'b']);
  });
});

describe('ParkingSearchService', () => {
  it('プロバイダから取得した結果を、フィルタして距離順に返す', async () => {
    const { service, provider } = createService([FAR, PRIVATE, NEAR]);

    const results = await service.search(CENTER, 500);

    expect(results.map((result) => result.id)).toEqual(['near', 'far']);
    expect(provider.searchNearby).toHaveBeenCalledWith(CENTER, 500, undefined);
  });

  it('同じ条件の 2 回目の検索ではキャッシュが使われ、プロバイダは呼ばれない', async () => {
    const { service, provider } = createService([NEAR]);

    await service.search(CENTER, 500);
    const results = await service.search(CENTER, 500);

    expect(results).toHaveLength(1);
    expect(provider.searchNearby).toHaveBeenCalledTimes(1);
  });

  it('キャッシュを使った場合も、実際の検索中心からの距離で計算される', async () => {
    const { service } = createService([NEAR]);
    await service.search(CENTER, 500);
    const nearbyCenter = { lat: 34.39391, lng: 131.40108 };

    const [result] = await service.search(nearbyCenter, 500);

    expect(result?.distanceM).toBe(calcDistanceM(nearbyCenter, NEAR.location));
    expect(result?.distanceM).not.toBe(calcDistanceM(CENTER, NEAR.location));
  });

  it('半径が違う場合はプロバイダが呼ばれる', async () => {
    const { service, provider } = createService([NEAR]);

    await service.search(CENTER, 500);
    await service.search(CENTER, 1000);

    expect(provider.searchNearby).toHaveBeenCalledTimes(2);
  });

  it('プロバイダのエラーはそのまま呼び出し元に伝わり、キャッシュされない', async () => {
    const provider: ParkingProvider = {
      searchNearby: vi.fn().mockRejectedValueOnce(new Error('失敗')).mockResolvedValue([NEAR]),
    };
    const service = new ParkingSearchService({
      provider,
      cache: new SearchCache(),
      throttle: new RequestThrottle({ minIntervalMs: 0 }),
    });

    await expect(service.search(CENTER, 500)).rejects.toThrow('失敗');
    await expect(service.search(CENTER, 500)).resolves.toHaveLength(1);
  });

  it('外部 API の呼び出しは間隔制御を経由する', async () => {
    const throttle = new RequestThrottle({ minIntervalMs: 0 });
    const runSpy = vi.spyOn(throttle, 'run');
    const service = new ParkingSearchService({
      provider: { searchNearby: async () => [] },
      cache: new SearchCache(),
      throttle,
    });
    const controller = new AbortController();

    await service.search(CENTER, 500, controller.signal);

    expect(runSpy).toHaveBeenCalledWith(expect.any(Function), controller.signal);
  });
});
