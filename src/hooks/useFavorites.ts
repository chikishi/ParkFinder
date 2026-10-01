import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFavorites, saveFavorites } from '@/storage/favoritesStorage';
import type { Favorite, ParkingLot } from '@/types/domain';
import { getParkingName } from '@/utils/parkingDisplay';
import { truncateMemo } from '@/utils/validation';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);
  const isLoadedRef = useRef(false);

  // 読み込み直後は保存せず、変更があったときだけ保存する
  useEffect(() => {
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      return;
    }
    saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback(
    (parkingId: string) => favorites.some((favorite) => favorite.parkingId === parkingId),
    [favorites],
  );

  const findFavorite = useCallback(
    (parkingId: string) => favorites.find((favorite) => favorite.parkingId === parkingId),
    [favorites],
  );

  /** お気に入りの登録・解除を切り替える */
  const toggle = useCallback((parkingLot: ParkingLot) => {
    const now = new Date().toISOString();
    setFavorites((current) => {
      if (current.some((favorite) => favorite.parkingId === parkingLot.id)) {
        return current.filter((favorite) => favorite.parkingId !== parkingLot.id);
      }
      const favorite: Favorite = {
        parkingId: parkingLot.id,
        name: getParkingName(parkingLot),
        location: parkingLot.location,
        memo: '',
        createdAt: now,
        updatedAt: now,
      };
      return [favorite, ...current];
    });
  }, []);

  const updateMemo = useCallback((parkingId: string, memo: string) => {
    const truncated = truncateMemo(memo);
    const now = new Date().toISOString();
    setFavorites((current) => {
      const target = current.find((favorite) => favorite.parkingId === parkingId);
      if (target === undefined || target.memo === truncated) {
        return current;
      }
      return current.map((favorite) =>
        favorite === target ? { ...favorite, memo: truncated, updatedAt: now } : favorite,
      );
    });
  }, []);

  return { favorites, isFavorite, findFavorite, toggle, updateMemo };
}
