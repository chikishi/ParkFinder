import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ParkingList } from '@/components/ParkingList';
import type { ParkingSearchResult } from '@/types/domain';

const RESULTS: ParkingSearchResult[] = [
  {
    id: 'osm:way/1',
    source: 'osm',
    name: '萩駅前パーキング',
    location: { lat: 34.3957, lng: 131.401 },
    parkingType: 'surface',
    fee: 'yes',
    capacity: 24,
    distanceM: 120,
  },
  {
    id: 'osm:node/2',
    source: 'osm',
    location: { lat: 34.393, lng: 131.401 },
    parkingType: 'unknown',
    fee: 'unknown',
    distanceM: 1250,
  },
];

function renderList(overrides: Partial<Parameters<typeof ParkingList>[0]> = {}) {
  const props = {
    status: 'success' as const,
    results: RESULTS,
    radiusM: 500 as const,
    isFavorite: () => false,
    onSelect: vi.fn(),
    onRadiusChange: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
  render(<ParkingList {...props} />);
  return props;
}

describe('ParkingList', () => {
  it('駐車場が名称・属性の要約・距離とともに並ぶ', () => {
    renderList();

    const items = within(screen.getByRole('list', { name: '駐車場一覧' })).getAllByRole('button');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('萩駅前パーキング');
    expect(items[0]).toHaveTextContent('平面 / 有料 / 24台');
    expect(items[0]).toHaveTextContent('120m');
    expect(items[1]).toHaveTextContent('名称不明の駐車場');
    expect(items[1]).toHaveTextContent('1.3km');
  });

  it('項目を選ぶと、その駐車場の ID で onSelect が呼ばれる', async () => {
    const props = renderList();

    await userEvent.click(screen.getByRole('button', { name: /萩駅前パーキング/ }));

    expect(props.onSelect).toHaveBeenCalledWith('osm:way/1');
  });

  it('選択中の項目は強調表示される', () => {
    renderList({ selectedId: 'osm:node/2' });

    expect(screen.getByRole('button', { name: /名称不明/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: /萩駅前/ })).not.toHaveAttribute('aria-current');
  });

  it('お気に入りの駐車場には、その旨が表示される', () => {
    renderList({ isFavorite: (id) => id === 'osm:way/1' });

    expect(screen.getByRole('button', { name: /萩駅前パーキング/ })).toHaveTextContent(
      'お気に入り',
    );
  });

  it('半径を選ぶと onRadiusChange が呼ばれる', async () => {
    const props = renderList();

    await userEvent.click(screen.getByRole('radio', { name: '1km' }));

    expect(props.onRadiusChange).toHaveBeenCalledWith(1000);
    expect(screen.getByRole('radio', { name: '500m' })).toHaveAttribute('aria-checked', 'true');
  });

  it('検索中は読み込み中の表示になる', () => {
    renderList({ status: 'loading', results: [] });

    expect(screen.getByRole('status')).toHaveTextContent('駐車場を検索しています');
  });

  it('失敗時はエラーと再試行ボタンが表示され、押すと onRetry が呼ばれる', async () => {
    const props = renderList({ status: 'error', results: [], errorKind: 'timeout' });

    expect(screen.getByRole('alert')).toHaveTextContent('駐車場情報を取得できませんでした');
    await userEvent.click(screen.getByRole('button', { name: '再試行' }));

    expect(props.onRetry).toHaveBeenCalled();
  });

  it('混雑による失敗の場合は、その旨が表示される', () => {
    renderList({ status: 'error', results: [], errorKind: 'rate-limit' });

    expect(screen.getByRole('alert')).toHaveTextContent('サーバーが混雑しています');
  });

  it('0 件の場合は、範囲を広げるボタンで次に大きい半径が選ばれる', async () => {
    const props = renderList({ results: [] });

    expect(screen.getByRole('status')).toHaveTextContent('この範囲に駐車場が見つかりませんでした');
    await userEvent.click(screen.getByRole('button', { name: '範囲を広げる' }));

    expect(props.onRadiusChange).toHaveBeenCalledWith(1000);
  });

  it('最大の半径で 0 件の場合は、範囲を広げるボタンが表示されない', () => {
    renderList({ results: [], radiusM: 1000 });

    expect(screen.queryByRole('button', { name: '範囲を広げる' })).not.toBeInTheDocument();
  });
});
