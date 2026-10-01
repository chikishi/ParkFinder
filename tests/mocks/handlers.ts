import { http, HttpResponse, type AnyHandler, type JsonBodyType } from 'msw';
import nominatimSearch from '../fixtures/nominatim-search.json';
import overpassParking from '../fixtures/overpass-parking.json';

/** テストで使う架空のエンドポイント（実際の外部 API は呼び出さない） */
export const TEST_OVERPASS_URL = 'https://overpass.test/api/interpreter';
export const TEST_NOMINATIM_URL = 'https://nominatim.test';

/** Overpass の応答を差し替えるハンドラ */
export function overpassHandler(body: JsonBodyType, init?: { status?: number }): AnyHandler {
  return http.post(TEST_OVERPASS_URL, () =>
    init?.status !== undefined && init.status >= 400
      ? new HttpResponse(null, { status: init.status })
      : HttpResponse.json(body),
  );
}

/** Nominatim の応答を差し替えるハンドラ */
export function nominatimHandler(body: JsonBodyType, init?: { status?: number }): AnyHandler {
  return http.get(`${TEST_NOMINATIM_URL}/search`, () =>
    init?.status !== undefined && init.status >= 400
      ? new HttpResponse(null, { status: init.status })
      : HttpResponse.json(body),
  );
}

/** 既定のハンドラ。各テストでは server.use() で必要な応答に差し替える */
export const handlers: AnyHandler[] = [
  overpassHandler(overpassParking),
  nominatimHandler(nominatimSearch),
];
