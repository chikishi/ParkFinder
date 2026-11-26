import { readFileSync } from 'node:fs';
import type { Page, Request } from '@playwright/test';

/** アプリの既定のエンドポイント（src/config.ts）。E2E テストでは実際には通信せず差し替える */
const OVERPASS_URLS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search**';
const TILE_URL = 'https://tile.openstreetmap.org/**';

/** 1×1 の透明な PNG */
const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export function readFixture(name: string): string {
  return readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), 'utf8');
}

type MockOptions = {
  overpassBody?: string;
  overpassStatus?: number;
  nominatimBody?: string;
};

/** Overpass に送られたクエリ（Overpass QL）を記録する */
export type OverpassLog = { queries: string[] };

function readOverpassQuery(request: Request): string {
  return new URLSearchParams(request.postData() ?? '').get('data') ?? '';
}

/**
 * 外部 API（Overpass・Nominatim・地図タイル）をすべて差し替える。
 * 差し替えていない外部への通信は失敗させ、実際の外部 API を呼び出さないようにする。
 */
export async function mockExternalApis(
  page: Page,
  options: MockOptions = {},
): Promise<OverpassLog> {
  const log: OverpassLog = { queries: [] };
  const overpassStatus = options.overpassStatus ?? 200;
  // 失敗させる場合は、最初の検索ですべての検索先を失敗させる（アプリは検索先を順に試すため）。
  // その後は成功させ、再試行を確認できるようにする
  let failuresLeft = overpassStatus !== 200 ? OVERPASS_URLS.length : 0;

  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
  await page.route(TILE_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG }),
  );
  for (const url of OVERPASS_URLS) {
    await page.route(url, (route) => {
      if (failuresLeft > 0) {
        failuresLeft -= 1;
        // 失敗した通信は記録しない。log.queries には、結果を返した検索だけが残る
        return route.fulfill({ status: overpassStatus, body: '' });
      }
      log.queries.push(readOverpassQuery(route.request()));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: options.overpassBody ?? readFixture('overpass-parking.json'),
      });
    });
  }
  await page.route(NOMINATIM_SEARCH_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: options.nominatimBody ?? readFixture('nominatim-search.json'),
    }),
  );
  return log;
}

/** 地図上の指定した位置（地図の幅・高さに対する割合）をタップする */
export async function tapMap(page: Page, xRatio = 0.5, yRatio = 0.3): Promise<void> {
  const map = page.locator('.leaflet-container');
  const box = await map.boundingBox();
  if (box === null) {
    throw new Error('地図が表示されていません');
  }
  await map.click({ position: { x: box.width * xRatio, y: box.height * yRatio } });
}
