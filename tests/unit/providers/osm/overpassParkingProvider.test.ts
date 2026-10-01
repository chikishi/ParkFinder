import { http, HttpResponse, delay } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OverpassParkingProvider,
  buildOverpassQuery,
} from '@/providers/osm/overpassParkingProvider';
import { ProviderError } from '@/providers/types';
import overpassEmpty from '../../../fixtures/overpass-empty.json';
import overpassMalformed from '../../../fixtures/overpass-malformed.json';
import { TEST_OVERPASS_URL, overpassHandler } from '../../../mocks/handlers';
import { server } from '../../../mocks/server';

const CENTER = { lat: 34.393885, lng: 131.401059 };

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('エラーが発生しませんでした');
}

describe('buildOverpassQuery', () => {
  it('node・way・relation の駐車場を半径と中心で検索するクエリになる', () => {
    const query = buildOverpassQuery(CENTER, 500);

    expect(query).toContain('[out:json]');
    expect(query).toContain('node["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('way["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('relation["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('out center tags;');
  });

  it('半径は整数に丸められる', () => {
    expect(buildOverpassQuery(CENTER, 299.6)).toContain('around:300,');
  });

  it('座標や半径が不正な場合は例外になる', () => {
    expect(() => buildOverpassQuery({ lat: 100, lng: 0 }, 500)).toThrow(RangeError);
    expect(() => buildOverpassQuery(CENTER, 0)).toThrow(RangeError);
    expect(() => buildOverpassQuery(CENTER, Number.NaN)).toThrow(RangeError);
    expect(() => buildOverpassQuery(CENTER, 10_000)).toThrow(RangeError);
  });
});

describe('OverpassParkingProvider', () => {
  const provider = new OverpassParkingProvider(TEST_OVERPASS_URL);

  afterEach(() => {
    vi.useRealTimers();
  });

  it('クエリをフォーム形式で POST し、駐車場の一覧を返す', async () => {
    let receivedQuery: string | null = null;
    server.use(
      http.post(TEST_OVERPASS_URL, async ({ request }) => {
        receivedQuery = new URLSearchParams(await request.text()).get('data');
        return HttpResponse.json(overpassEmpty);
      }),
    );

    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toEqual([]);
    expect(receivedQuery).toBe(buildOverpassQuery(CENTER, 500));
  });

  it('既定の応答では 5 件の駐車場が返る', async () => {
    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toHaveLength(5);
  });

  it('不正な要素を含む応答では、正常な要素だけが返る', async () => {
    server.use(overpassHandler(overpassMalformed));

    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toHaveLength(1);
  });

  it.each([429, 504])('HTTP %i の場合は rate-limit のエラーになる', async (status) => {
    server.use(overpassHandler(null, { status }));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ kind: 'rate-limit' });
  });

  it('その他の HTTP エラーは network のエラーになる', async () => {
    server.use(overpassHandler(null, { status: 500 }));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'network' });
  });

  it('通信自体に失敗した場合は network のエラーになる', async () => {
    server.use(http.post(TEST_OVERPASS_URL, () => HttpResponse.error()));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'network' });
  });

  it('JSON でない応答は invalid-response のエラーになる', async () => {
    server.use(http.post(TEST_OVERPASS_URL, () => HttpResponse.text('<html>busy</html>')));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'invalid-response' });
  });

  it('elements が無い応答は invalid-response のエラーになる', async () => {
    server.use(overpassHandler({ remark: 'runtime error' }));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'invalid-response' });
  });

  it('呼び出し元が中断した場合は aborted のエラーになる', async () => {
    server.use(
      http.post(TEST_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
    );
    const controller = new AbortController();

    const promise = catchError(provider.searchNearby(CENTER, 500, controller.signal));
    controller.abort();

    expect(await promise).toMatchObject({ kind: 'aborted' });
  });

  it('中断済みの signal を渡した場合は通信せずに aborted のエラーになる', async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await catchError(provider.searchNearby(CENTER, 500, controller.signal));

    expect(error).toMatchObject({ kind: 'aborted' });
  });

  it('15 秒以内に応答が無い場合は timeout のエラーになる', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    server.use(
      http.post(TEST_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
    );

    const promise = catchError(provider.searchNearby(CENTER, 500));
    await vi.advanceTimersByTimeAsync(15_000);

    expect(await promise).toMatchObject({ kind: 'timeout' });
  });
});
