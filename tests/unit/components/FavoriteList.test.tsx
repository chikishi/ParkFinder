import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteList } from '@/components/FavoriteList';
import type { Favorite } from '@/types/domain';

const FAVORITES: Favorite[] = [
  {
    parkingId: 'osm:way/1',
    name: '萩駅前パーキング',
    location: { lat: 34.39575, lng: 131.40106 },
    memo: '入口が狭い',
    createdAt: '2026-09-30T00:00:00.000Z',
    updatedAt: '2026-09-30T00:00:00.000Z',
  },
  {
    parkingId: 'osm:node/2',
    name: '椿立体駐車場',
    location: { lat: 34.393, lng: 131.401 },
    memo: '',
    createdAt: '2026-09-30T00:00:00.000Z',
    updatedAt: '2026-09-30T00:00:00.000Z',
  },
];

describe('FavoriteList', () => {
  it('お気に入りが名称とメモとともに並び、選ぶと onSelect が呼ばれる', async () => {
    const onSelect = vi.fn();
    render(<FavoriteList favorites={FAVORITES} onSelect={onSelect} onBack={vi.fn()} />);

    const first = screen.getByRole('button', { name: /萩駅前パーキング/ });
    expect(first).toHaveTextContent('入口が狭い');
    await userEvent.click(first);

    expect(onSelect).toHaveBeenCalledWith(FAVORITES[0]);
  });

  it('お気に入りが無い場合は、登録方法の案内が表示される', () => {
    render(<FavoriteList favorites={[]} onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText(/お気に入りはまだありません/)).toBeInTheDocument();
  });

  it('戻るボタンで onBack が呼ばれる', async () => {
    const onBack = vi.fn();
    render(<FavoriteList favorites={FAVORITES} onSelect={vi.fn()} onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', { name: '戻る' }));

    expect(onBack).toHaveBeenCalled();
  });
});
