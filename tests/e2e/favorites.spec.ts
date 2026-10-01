import { expect, test } from '@playwright/test';
import { mockExternalApis, tapMap } from './support/mockExternalApis';

test('シナリオ 6：お気に入りとメモが、ページを再読み込みしても残っている', async ({ page }) => {
  await mockExternalApis(page);
  await page.goto('/');
  await tapMap(page);
  await page
    .getByRole('list', { name: '駐車場一覧' })
    .getByRole('button', { name: /萩駅前パーキング/ })
    .click();

  await page.getByRole('button', { name: 'お気に入りに登録' }).click();
  const memo = page.getByLabel('メモ');
  await memo.fill('入口が狭い');
  // フォーカスが外れたときに保存される
  await memo.blur();
  await expect(page.getByRole('button', { name: 'お気に入りを解除' })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'お気に入り一覧' }).click();

  const favorite = page
    .getByRole('list', { name: 'お気に入り一覧' })
    .getByRole('button', { name: /萩駅前パーキング/ });
  await expect(favorite).toContainText('入口が狭い');

  // お気に入りを選ぶと、その駐車場の周辺が検索され、一覧で強調表示される
  await favorite.click();
  await expect(
    page
      .getByRole('list', { name: '駐車場一覧' })
      .getByRole('button', { name: /萩駅前パーキング/ }),
  ).toHaveAttribute('aria-current', 'true');
});
