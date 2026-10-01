import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFavorites } from '@/hooks/useFavorites';
import { loadFavorites } from '@/storage/favoritesStorage';
import type { ParkingLot } from '@/types/domain';

const PARKING: ParkingLot = {
  id: 'osm:way/1001',
  source: 'osm',
  name: '萩駅前パーキング',
  location: { lat: 34.39575, lng: 131.40106 },
  parkingType: 'surface',
  fee: 'yes',
};

const UNNAMED: ParkingLot = { ...PARKING, id: 'osm:way/1003', name: undefined };

describe('useFavorites', () => {
  it('登録すると、お気に入りに追加されて保存される', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(PARKING));

    expect(result.current.isFavorite(PARKING.id)).toBe(true);
    expect(result.current.favorites[0]).toMatchObject({
      parkingId: PARKING.id,
      name: '萩駅前パーキング',
      location: PARKING.location,
      memo: '',
    });
    expect(loadFavorites()).toEqual(result.current.favorites);
  });

  it('登録済みの駐車場で切り替えると解除される', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(PARKING));

    act(() => result.current.toggle(PARKING));

    expect(result.current.isFavorite(PARKING.id)).toBe(false);
    expect(loadFavorites()).toEqual([]);
  });

  it('名称が無い駐車場は「名称不明の駐車場」として登録される', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(UNNAMED));

    expect(result.current.findFavorite(UNNAMED.id)?.name).toBe('名称不明の駐車場');
  });

  it('新しく登録したものが先頭になる', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(PARKING));
    act(() => result.current.toggle(UNNAMED));

    expect(result.current.favorites.map((favorite) => favorite.parkingId)).toEqual([
      UNNAMED.id,
      PARKING.id,
    ]);
  });

  it('メモを更新すると保存され、500 文字を超えた分は切り詰められる', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(PARKING));

    act(() => result.current.updateMemo(PARKING.id, 'あ'.repeat(600)));

    expect(result.current.findFavorite(PARKING.id)?.memo).toHaveLength(500);
    expect(loadFavorites()[0]?.memo).toHaveLength(500);
  });

  it('お気に入りに無い駐車場のメモは更新されない', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.updateMemo('osm:node/999', 'メモ'));

    expect(result.current.favorites).toEqual([]);
  });

  it('再度読み込んでも（再読み込み後を想定）、お気に入りとメモが残っている', () => {
    const first = renderHook(() => useFavorites());
    act(() => first.result.current.toggle(PARKING));
    act(() => first.result.current.updateMemo(PARKING.id, '入口が狭い'));
    first.unmount();

    const { result } = renderHook(() => useFavorites());

    expect(result.current.findFavorite(PARKING.id)?.memo).toBe('入口が狭い');
  });
});
