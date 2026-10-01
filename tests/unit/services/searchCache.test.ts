import { describe, expect, it } from 'vitest';
import { SearchCache, toCacheKey } from '@/services/searchCache';
import type { ParkingLot } from '@/types/domain';

const CENTER = { lat: 34.393885, lng: 131.401059 };

const parkingLot = (id: string): ParkingLot => ({
  id,
  source: 'osm',
  location: CENTER,
  parkingType: 'unknown',
  fee: 'unknown',
});

function createClock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('toCacheKey', () => {
  it('小数点以下 4 桁に丸めて同じになる地点は同じキーになる', () => {
    expect(toCacheKey(CENTER, 500)).toBe(toCacheKey({ lat: 34.39391, lng: 131.40108 }, 500));
  });

  it('小数点以下 4 桁に丸めて異なる地点は別のキーになる', () => {
    expect(toCacheKey(CENTER, 500)).not.toBe(toCacheKey({ lat: 34.3942, lng: 131.401059 }, 500));
  });

  it('半径が違えば別のキーになる', () => {
    expect(toCacheKey(CENTER, 500)).not.toBe(toCacheKey(CENTER, 1000));
  });
});

describe('SearchCache', () => {
  it('保存した結果を取得できる', () => {
    const cache = new SearchCache();
    const parkingLots = [parkingLot('a')];

    cache.set(CENTER, 500, parkingLots);

    expect(cache.get(CENTER, 500)).toBe(parkingLots);
  });

  it('保存していない条件では undefined になる', () => {
    const cache = new SearchCache();

    expect(cache.get(CENTER, 500)).toBeUndefined();
  });

  it('有効期間（10 分）内は取得でき、過ぎると取得できない', () => {
    const clock = createClock();
    const cache = new SearchCache({ now: clock.now });
    cache.set(CENTER, 500, [parkingLot('a')]);

    clock.advance(10 * 60 * 1000 - 1);
    expect(cache.get(CENTER, 500)).toBeDefined();

    clock.advance(1);
    expect(cache.get(CENTER, 500)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('件数が上限を超えると、最も古いものから削除される', () => {
    const cache = new SearchCache({ maxEntries: 2 });
    const centers = [
      { lat: 34.1, lng: 131.1 },
      { lat: 34.2, lng: 131.2 },
      { lat: 34.3, lng: 131.3 },
    ] as const;

    for (const center of centers) {
      cache.set(center, 500, []);
    }

    expect(cache.size).toBe(2);
    expect(cache.get(centers[0], 500)).toBeUndefined();
    expect(cache.get(centers[1], 500)).toBeDefined();
    expect(cache.get(centers[2], 500)).toBeDefined();
  });

  it('同じ条件で保存し直すと、最新のものとして扱われる', () => {
    const cache = new SearchCache({ maxEntries: 2 });
    const a = { lat: 34.1, lng: 131.1 };
    const b = { lat: 34.2, lng: 131.2 };
    const c = { lat: 34.3, lng: 131.3 };

    cache.set(a, 500, []);
    cache.set(b, 500, []);
    cache.set(a, 500, []);
    cache.set(c, 500, []);

    expect(cache.get(a, 500)).toBeDefined();
    expect(cache.get(b, 500)).toBeUndefined();
  });
});
