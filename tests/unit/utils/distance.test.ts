import { describe, expect, it } from 'vitest';
import { calcDistanceM, formatDistance } from '@/utils/distance';

const HAGI_STATION = { lat: 34.393885, lng: 131.401059 };

describe('calcDistanceM', () => {
  it('同じ地点の距離は 0', () => {
    expect(calcDistanceM(HAGI_STATION, HAGI_STATION)).toBe(0);
  });

  it('緯度 0.001 度の差は約 111m', () => {
    const north = { lat: HAGI_STATION.lat + 0.001, lng: HAGI_STATION.lng };

    expect(calcDistanceM(HAGI_STATION, north)).toBe(111);
  });

  it('赤道上の経度 1 度の差は、地球の円周の 360 分の 1（約 111,195m）', () => {
    const distanceM = calcDistanceM({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });

    expect(distanceM).toBe(Math.round((2 * Math.PI * 6_371_008.8) / 360));
  });

  it('向きを入れ替えても距離は同じ', () => {
    const other = { lat: 34.41, lng: 131.42 };

    expect(calcDistanceM(HAGI_STATION, other)).toBe(calcDistanceM(other, HAGI_STATION));
  });
});

describe('formatDistance', () => {
  it('1km 未満はメートルで表示される', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('1km 以上は小数 1 桁の km で表示される', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1250)).toBe('1.3km');
  });
});
