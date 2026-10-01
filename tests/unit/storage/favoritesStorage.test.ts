import { describe, expect, it } from 'vitest';
import { loadFavorites, saveFavorites } from '@/storage/favoritesStorage';
import { STORAGE_PREFIX } from '@/storage/storage';
import type { Favorite } from '@/types/domain';

const FAVORITE: Favorite = {
  parkingId: 'osm:way/1001',
  name: '萩駅前パーキング',
  location: { lat: 34.39575, lng: 131.40106 },
  memo: '入口が狭い',
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

describe('favoritesStorage', () => {
  it('保存したお気に入りを読み込める', () => {
    saveFavorites([FAVORITE]);

    expect(loadFavorites()).toEqual([FAVORITE]);
  });

  it('保存されていない場合は空の配列になる', () => {
    expect(loadFavorites()).toEqual([]);
  });

  it('データが壊れている場合は空の配列になる', () => {
    localStorage.setItem(`${STORAGE_PREFIX}favorites`, 'not json');

    expect(loadFavorites()).toEqual([]);
  });

  it('配列でない場合は空の配列になる', () => {
    localStorage.setItem(`${STORAGE_PREFIX}favorites`, '{"a":1}');

    expect(loadFavorites()).toEqual([]);
  });

  it('形式が不正な項目だけが捨てられる', () => {
    const invalidItems = [
      { ...FAVORITE, parkingId: '' },
      { ...FAVORITE, location: { lat: 100, lng: 0 } },
      { ...FAVORITE, memo: 'a'.repeat(501) },
      { ...FAVORITE, createdAt: undefined },
      null,
      'text',
    ];
    localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify([...invalidItems, FAVORITE]));

    expect(loadFavorites()).toEqual([FAVORITE]);
  });
});
