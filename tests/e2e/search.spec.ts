import { expect, test, type Page } from '@playwright/test';
import { mockExternalApis, readFixture, tapMap } from './support/mockExternalApis';

const parkingList = (page: Page) => page.getByRole('list', { name: '駐車場一覧' });

test.describe('周辺駐車場の検索', () => {
  test('シナリオ 1：地図をタップすると、周辺の駐車場が地図と一覧に表示される', async ({ page }) => {
    const log = await mockExternalApis(page);
    await page.goto('/');

    await tapMap(page);

    const items = parkingList(page).getByRole('button');
    // テストデータ 5 件のうち、access=private の 1 件は除外される
    await expect(items).toHaveCount(4);
    await expect(page.getByRole('status').filter({ hasText: '4件見つかりました' })).toBeVisible();
    await expect(page.locator('path.pf-parking-marker')).toHaveCount(4);
    await expect(page.locator('.pf-center-icon')).toBeVisible();
    await expect(page.getByText('社員専用駐車場')).toHaveCount(0);
    expect(log.queries).toHaveLength(1);
    expect(log.queries[0]).toMatch(/around:500,/);
  });

  test('シナリオ 2：検索半径を変更すると、同じ中心で再検索される', async ({ page }) => {
    const log = await mockExternalApis(page);
    await page.goto('/');
    await tapMap(page);
    await expect(parkingList(page).getByRole('button')).toHaveCount(4);

    await page.getByRole('radio', { name: '1km' }).click();

    await expect.poll(() => log.queries.length).toBe(2);
    const [first = '', second = ''] = log.queries;
    const center = (query: string) => query.match(/around:\d+,([\d.]+,[\d.]+)\)/)?.[1];
    expect(second).toMatch(/around:1000,/);
    expect(center(second)).toBe(center(first));
    await expect(page.getByRole('radio', { name: '1km' })).toHaveAttribute('aria-checked', 'true');
  });

  test('シナリオ 3：一覧から選ぶと詳細が表示され、ナビのリンクに正しい座標が入っている', async ({
    page,
  }) => {
    await mockExternalApis(page);
    await page.goto('/');
    await tapMap(page);

    await parkingList(page)
      .getByRole('button', { name: /萩駅前パーキング/ })
      .click();

    await expect(page.getByRole('heading', { name: '萩駅前パーキング' })).toBeVisible();
    await expect(page.getByText('24台')).toBeVisible();
    await expect(page.locator('path.pf-parking-marker.is-selected')).toHaveCount(1);
    const href = await page.getByRole('link', { name: 'ナビを開始' }).getAttribute('href');
    const url = new URL(href ?? '');
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('destination')).toBe('34.39575,131.40106');
    expect(url.searchParams.get('travelmode')).toBe('driving');
  });

  test.describe('現在地', () => {
    test.use({
      geolocation: { latitude: 34.3945, longitude: 131.4021 },
      permissions: ['geolocation'],
    });

    test('シナリオ 4：現在地ボタンで、現在地の周辺が検索される', async ({ page }) => {
      const log = await mockExternalApis(page);
      await page.goto('/');

      await page.getByRole('button', { name: '現在地の周辺を検索' }).click();

      await expect(parkingList(page).getByRole('button')).toHaveCount(4);
      expect(log.queries[0]).toContain('around:500,34.3945,131.4021');
      await expect(page.locator('path.pf-user-location')).toHaveCount(1);
    });
  });

  test('シナリオ 5：地名検索で候補を選ぶと、その地点の周辺が検索される', async ({ page }) => {
    const log = await mockExternalApis(page);
    await page.goto('/');

    await page.getByLabel('地名・住所').fill('萩駅');
    await page.getByRole('button', { name: '検索', exact: true }).click();
    await page.getByRole('button', { name: /^萩駅, 萩三隅線/ }).click();

    await expect(parkingList(page).getByRole('button')).toHaveCount(4);
    expect(log.queries[0]).toContain('around:500,34.3938852,131.4010588');
    await expect(page.getByRole('list', { name: '検索候補' })).toHaveCount(0);
  });

  test('検索に失敗すると、エラーと再試行ボタンが表示され、再試行で結果が表示される', async ({
    page,
  }) => {
    await mockExternalApis(page, { overpassStatus: 504 });
    await page.goto('/');
    await tapMap(page);

    await expect(page.getByRole('alert')).toContainText('サーバーが混雑しています');
    await page.getByRole('button', { name: '再試行' }).click();

    await expect(parkingList(page).getByRole('button')).toHaveCount(4);
  });

  test('0 件の場合は案内が表示され、範囲を広げると再検索される', async ({ page }) => {
    const log = await mockExternalApis(page, { overpassBody: readFixture('overpass-empty.json') });
    await page.goto('/');
    await tapMap(page);

    await expect(page.getByText('この範囲に駐車場が見つかりませんでした')).toBeVisible();
    await page.getByRole('button', { name: '範囲を広げる' }).click();

    await expect.poll(() => log.queries.length).toBe(2);
    expect(log.queries[1]).toMatch(/around:1000,/);
  });
});
