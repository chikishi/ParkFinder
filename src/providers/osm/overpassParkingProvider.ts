import { fetchJson } from '@/providers/fetchJson';
import { toParkingLots } from '@/providers/osm/overpassMapper';
import { ProviderError, type ParkingProvider } from '@/providers/types';
import type { LatLng, ParkingLot } from '@/types/domain';
import { isValidLatLng } from '@/utils/validation';

const TIMEOUT_MS = 15_000;
const MAX_RADIUS_M = 5_000;

/** 周辺の駐車場を取得する Overpass QL を生成する */
export function buildOverpassQuery(center: LatLng, radiusM: number): string {
  // 値をクエリに埋め込むため、数値として検証してから使う
  if (!isValidLatLng(center)) {
    throw new RangeError('座標が不正です');
  }
  const radius = Math.round(radiusM);
  if (!Number.isFinite(radius) || radius <= 0 || radius > MAX_RADIUS_M) {
    throw new RangeError('検索半径が不正です');
  }
  const around = `around:${radius},${center.lat},${center.lng}`;
  return [
    '[out:json][timeout:25];',
    '(',
    `  node["amenity"="parking"](${around});`,
    `  way["amenity"="parking"](${around});`,
    `  relation["amenity"="parking"](${around});`,
    ');',
    'out center tags;',
  ].join('\n');
}

export class OverpassParkingProvider implements ParkingProvider {
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async searchNearby(center: LatLng, radiusM: number, signal?: AbortSignal): Promise<ParkingLot[]> {
    const query = buildOverpassQuery(center, radiusM);
    const json = await fetchJson(this.endpoint, {
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
      },
      signal,
      timeoutMs: TIMEOUT_MS,
    });

    const parkingLots = toParkingLots(json);
    if (parkingLots === undefined) {
      throw new ProviderError('invalid-response', 'Overpass の応答の形式が不正です');
    }
    return parkingLots;
  }
}
