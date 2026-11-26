import { http, HttpResponse, delay } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OverpassParkingProvider,
  QUERY_TIMEOUT_S,
  TIMEOUT_MS,
  buildOverpassQuery,
} from '@/providers/osm/overpassParkingProvider';
import { ProviderError } from '@/providers/types';
import overpassEmpty from '../../../fixtures/overpass-empty.json';
import overpassMalformed from '../../../fixtures/overpass-malformed.json';
import { TEST_OVERPASS_URL, overpassHandler } from '../../../mocks/handlers';
import { server } from '../../../mocks/server';

const CENTER = { lat: 34.393885, lng: 131.401059 };
/** 切り替え先の検索先（テスト用の架空のエンドポイント） */
const SECOND_OVERPASS_URL = 'https://overpass-second.test/api/interpreter';

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

    expect(query).toContain('[out:json][timeout:10];');
    expect(query).toContain('node["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('way["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('relation["amenity"="parking"](around:500,34.393885,131.401059);');
    expect(query).toContain('out center tags;');
  });

  it('アプリのタイムアウトは、サーバーに許す処理時間の上限より長い', () => {
    // 逆になると、混雑時にサーバーが返そうとした結果をアプリが先に打ち切ってしまう
    expect(TIMEOUT_MS).toBeGreaterThan(QUERY_TIMEOUT_S * 1000);
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
  const provider = new OverpassParkingProvider([TEST_OVERPASS_URL]);

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

  it.each([429, 502, 503, 504])('HTTP %i の場合は rate-limit のエラーになる', async (status) => {
    server.use(overpassHandler(null, { status }));

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ kind: 'rate-limit' });
  });

  it.each([406, 500])('HTTP %i は network のエラーになる', async (status) => {
    server.use(overpassHandler(null, { status }));

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

  it('アプリのタイムアウトまでに応答が無い場合は timeout のエラーになる', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    server.use(
      http.post(TEST_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
    );

    const promise = catchError(provider.searchNearby(CENTER, 500));
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(await promise).toMatchObject({ kind: 'timeout' });
  });
});

describe('OverpassParkingProvider（複数の検索先）', () => {
  const provider = new OverpassParkingProvider([TEST_OVERPASS_URL, SECOND_OVERPASS_URL]);

  /** 2 か所目の検索先を空の結果で応答させ、呼ばれた回数を数える */
  function useSecondEndpoint(): { calls: () => number } {
    let calls = 0;
    server.use(
      http.post(SECOND_OVERPASS_URL, () => {
        calls += 1;
        return HttpResponse.json(overpassEmpty);
      }),
    );
    return { calls: () => calls };
  }

  /** 1 か所目の検索先が応答を返さないようにする */
  function useHangingFirstEndpoint(): void {
    server.use(
      http.post(TEST_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('検索先が空の場合は例外になる', () => {
    expect(() => new OverpassParkingProvider([])).toThrow(RangeError);
  });

  it('1 か所目が成功した場合は 2 か所目を呼ばない', async () => {
    const second = useSecondEndpoint();

    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toHaveLength(5);
    expect(second.calls()).toBe(0);
  });

  it.each([504, 502, 406])('1 か所目が HTTP %i の場合は 2 か所目の結果を返す', async (status) => {
    server.use(overpassHandler(null, { status }));
    const second = useSecondEndpoint();

    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toEqual([]);
    expect(second.calls()).toBe(1);
  });

  it('1 か所目の通信自体が失敗した場合は 2 か所目の結果を返す', async () => {
    server.use(http.post(TEST_OVERPASS_URL, () => HttpResponse.error()));
    const second = useSecondEndpoint();

    const parkingLots = await provider.searchNearby(CENTER, 500);

    expect(parkingLots).toEqual([]);
    expect(second.calls()).toBe(1);
  });

  it('1 か所目の応答の形式が不正な場合は 2 か所目を試さない', async () => {
    server.use(overpassHandler({ remark: 'runtime error' }));
    const second = useSecondEndpoint();

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'invalid-response' });
    expect(second.calls()).toBe(0);
  });

  it('1 か所目がタイムアウトした場合は 2 か所目の結果を返す', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    useHangingFirstEndpoint();
    const second = useSecondEndpoint();

    const promise = provider.searchNearby(CENTER, 500);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(await promise).toEqual([]);
    expect(second.calls()).toBe(1);
  });

  it('すべての検索先がタイムアウトした場合は timeout のエラーになる', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    server.use(
      http.post(TEST_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
      http.post(SECOND_OVERPASS_URL, async () => {
        await delay('infinite');
        return HttpResponse.json(overpassEmpty);
      }),
    );

    const promise = catchError(provider.searchNearby(CENTER, 500));
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS * 2);

    expect(await promise).toMatchObject({ kind: 'timeout' });
  });

  it('中断された場合は残りの検索先を試さない', async () => {
    useHangingFirstEndpoint();
    const second = useSecondEndpoint();
    const controller = new AbortController();

    const promise = catchError(provider.searchNearby(CENTER, 500, controller.signal));
    controller.abort();

    expect(await promise).toMatchObject({ kind: 'aborted' });
    expect(second.calls()).toBe(0);
  });

  it('すべての検索先が失敗した場合は最後のエラーを投げる', async () => {
    server.use(
      overpassHandler(null, { status: 504 }),
      http.post(SECOND_OVERPASS_URL, () => new HttpResponse(null, { status: 500 })),
    );

    const error = await catchError(provider.searchNearby(CENTER, 500));

    expect(error).toMatchObject({ kind: 'network' });
  });
});
