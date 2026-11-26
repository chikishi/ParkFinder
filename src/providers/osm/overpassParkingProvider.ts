import { fetchJson } from '@/providers/fetchJson';
import { toParkingLots } from '@/providers/osm/overpassMapper';
import { ProviderError, type ParkingProvider, type ProviderErrorKind } from '@/providers/types';
import type { LatLng, ParkingLot } from '@/types/domain';
import { isValidLatLng } from '@/utils/validation';

/**
 * サーバーに許す処理時間の上限（秒）。クエリの [timeout:N] に使う。
 * 駐車場の検索は混雑していなければ数秒で終わる。タイムアウト時は次の検索先を試すため短めにする
 */
export const QUERY_TIMEOUT_S = 10;
/** 応答の転送にかかる時間の余裕。サーバーが上限ぎりぎりで返した結果も受け取れるようにする */
const RESPONSE_MARGIN_MS = 5_000;
/** 検索先 1 か所あたり、アプリ側で通信を打ち切るまでの時間。サーバーの上限より短いと、混雑時に結果を受け取れない */
export const TIMEOUT_MS = QUERY_TIMEOUT_S * 1000 + RESPONSE_MARGIN_MS;
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
    `[out:json][timeout:${QUERY_TIMEOUT_S}];`,
    '(',
    `  node["amenity"="parking"](${around});`,
    `  way["amenity"="parking"](${around});`,
    `  relation["amenity"="parking"](${around});`,
    ');',
    'out center tags;',
  ].join('\n');
}

/**
 * 別の検索先で試し直す価値がある失敗。混雑・拒否・無応答は、その検索先だけの問題のことが多い。
 * 中断（aborted）と応答の形式の不正（invalid-response）は、検索先を変えても直らないため含めない
 */
const FALLBACK_ERROR_KINDS: ReadonlySet<ProviderErrorKind> = new Set([
  'rate-limit',
  'network',
  'timeout',
]);

function shouldTryNextEndpoint(error: unknown): boolean {
  return error instanceof ProviderError && FALLBACK_ERROR_KINDS.has(error.kind);
}

export class OverpassParkingProvider implements ParkingProvider {
  private readonly endpoints: readonly string[];

  /** endpoints は先頭から順に試す。混雑・通信エラー・タイムアウトのときだけ次の検索先に切り替える */
  constructor(endpoints: readonly string[]) {
    if (endpoints.length === 0) {
      throw new RangeError('検索先が指定されていません');
    }
    this.endpoints = endpoints;
  }

  async searchNearby(center: LatLng, radiusM: number, signal?: AbortSignal): Promise<ParkingLot[]> {
    const query = buildOverpassQuery(center, radiusM);
    let lastError: unknown;
    // 同じ検索先への再送はせず、各検索先を 1 回ずつ試す（相手サーバーへの負荷を考慮する）
    for (const endpoint of this.endpoints) {
      try {
        return await this.fetchFrom(endpoint, query, signal);
      } catch (error) {
        if (!shouldTryNextEndpoint(error)) {
          throw error;
        }
        lastError = error;
      }
    }
    throw lastError;
  }

  private async fetchFrom(
    endpoint: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<ParkingLot[]> {
    const json = await fetchJson(endpoint, {
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
