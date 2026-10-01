import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ParkingDetail } from '@/components/ParkingDetail';
import type { Favorite, ParkingSearchResult } from '@/types/domain';

const PARKING: ParkingSearchResult = {
  id: 'osm:way/1',
  source: 'osm',
  name: '<img src=x onerror=alert(1)>',
  location: { lat: 34.39575, lng: 131.40106 },
  parkingType: 'multi-storey',
  fee: 'no',
  capacity: 120,
  openingHours: '24/7',
  operator: 'テスト駐車場株式会社',
  distanceM: 316,
};

const FAVORITE: Favorite = {
  parkingId: PARKING.id,
  name: '椿立体駐車場',
  location: PARKING.location,
  memo: '入口が狭い',
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

function renderDetail(favorite?: Favorite) {
  const props = {
    parking: PARKING,
    favorite,
    onBack: vi.fn(),
    onToggleFavorite: vi.fn(),
    onMemoSave: vi.fn(),
  };
  render(<ParkingDetail {...props} />);
  return props;
}

describe('ParkingDetail', () => {
  it('名称・距離・属性が表示される', () => {
    renderDetail();

    expect(screen.getByText('中心から 316m（直線距離）')).toBeInTheDocument();
    expect(screen.getByText('立体')).toBeInTheDocument();
    expect(screen.getByText('無料')).toBeInTheDocument();
    expect(screen.getByText('120台')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('テスト駐車場株式会社')).toBeInTheDocument();
  });

  it('駐車場名は HTML として解釈されず、文字列として表示される', () => {
    const { container } = render(
      <ParkingDetail
        parking={PARKING}
        onBack={vi.fn()}
        onToggleFavorite={vi.fn()}
        onMemoSave={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(container.querySelector('img')).toBeNull();
  });

  it('ナビのリンクに駐車場の座標が入り、新しいタブで安全に開く', () => {
    renderDetail();

    const link = screen.getByRole('link', { name: 'ナビを開始' });
    const url = new URL(link.getAttribute('href') ?? '');
    expect(url.searchParams.get('destination')).toBe('34.39575,131.40106');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('戻るボタンで onBack が呼ばれる', async () => {
    const props = renderDetail();

    await userEvent.click(screen.getByRole('button', { name: '一覧に戻る' }));

    expect(props.onBack).toHaveBeenCalled();
  });

  it('お気に入りでない場合は登録ボタンが表示され、メモ欄は表示されない', async () => {
    const props = renderDetail();

    const toggle = screen.getByRole('button', { name: 'お気に入りに登録' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('メモ')).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(props.onToggleFavorite).toHaveBeenCalled();
  });

  it('お気に入りの場合はメモ欄が表示され、フォーカスが外れると保存される', async () => {
    const props = renderDetail(FAVORITE);

    expect(screen.getByRole('button', { name: 'お気に入りを解除' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const memo = screen.getByLabelText('メモ');
    expect(memo).toHaveValue('入口が狭い');
    await userEvent.type(memo, '、最大料金あり');
    expect(props.onMemoSave).not.toHaveBeenCalled();
    await userEvent.tab();

    expect(props.onMemoSave).toHaveBeenCalledWith('入口が狭い、最大料金あり');
  });

  it('メモは 500 文字までしか入力できない', () => {
    renderDetail(FAVORITE);

    expect(screen.getByLabelText('メモ')).toHaveAttribute('maxLength', '500');
  });
});
