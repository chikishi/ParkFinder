import { readJson, writeJson } from '@/storage/storage';
import type { Favorite } from '@/types/domain';
import { MAX_MEMO_LENGTH, isValidLatLng } from '@/utils/validation';

const KEY = 'favorites';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFavorite(value: unknown): value is Favorite {
  return (
    isRecord(value) &&
    typeof value.parkingId === 'string' &&
    value.parkingId !== '' &&
    typeof value.name === 'string' &&
    isValidLatLng(value.location) &&
    typeof value.memo === 'string' &&
    value.memo.length <= MAX_MEMO_LENGTH &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** お気に入りを読み込む。形式が不正な項目は捨てる */
export function loadFavorites(): Favorite[] {
  return readJson(KEY, isArray, []).filter(isFavorite);
}

export function saveFavorites(favorites: Favorite[]): boolean {
  return writeJson(KEY, favorites);
}
