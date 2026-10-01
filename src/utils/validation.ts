import { SEARCH_RADII_M, type LatLng, type SearchRadiusM } from '@/types/domain';

export const MAX_QUERY_LENGTH = 100;
export const MAX_MEMO_LENGTH = 500;

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidLatLng(value: unknown): value is LatLng {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const lat = 'lat' in value ? value.lat : undefined;
  const lng = 'lng' in value ? value.lng : undefined;
  return (
    isFiniteNumber(lat) &&
    isFiniteNumber(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isSearchRadius(value: unknown): value is SearchRadiusM {
  return SEARCH_RADII_M.some((radiusM) => radiusM === value);
}

/** 「緯度,経度」形式の文字列を解析する。不正な場合は undefined を返す */
export function parseLatLng(text: string): LatLng | undefined {
  const parts = text.split(',');
  if (parts.length !== 2) {
    return undefined;
  }
  const [latText = '', lngText = ''] = parts;
  if (latText.trim() === '' || lngText.trim() === '') {
    return undefined;
  }
  const location = { lat: Number(latText), lng: Number(lngText) };
  return isValidLatLng(location) ? location : undefined;
}

/** 地名検索の入力を正規化する。空の場合は undefined を返す */
export function normalizeQuery(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  return trimmed.slice(0, MAX_QUERY_LENGTH);
}

/** メモを上限文字数に切り詰める */
export function truncateMemo(text: string): string {
  return text.slice(0, MAX_MEMO_LENGTH);
}
