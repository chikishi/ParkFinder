import type { GeolocationErrorKind } from '@/hooks/useGeolocation';
import type { ProviderErrorKind } from '@/providers/types';

/** 画面に表示する文言（docs/functional-design.md 4.5 節） */
export const MESSAGES = {
  hint: '地図をタップすると、周辺の駐車場を探せます',
  searching: '駐車場を検索しています…',
  searchFailed: '駐車場情報を取得できませんでした',
  rateLimited: 'サーバーが混雑しています。少し待ってから再試行してください',
  noResults: 'この範囲に駐車場が見つかりませんでした',
  resultCount: (count: number) => `${count}件見つかりました`,
  retry: '再試行',
  expandRadius: '範囲を広げる',
  geolocationFailed: '現在地を取得できませんでした。端末の設定をご確認ください',
  geolocationUnsupported: 'この端末では現在地を取得できません',
  locating: '現在地を取得しています…',
  geocodeSearching: '場所を検索しています…',
  geocodeNoResults: '該当する場所が見つかりませんでした',
  geocodeFailed: '場所を検索できませんでした。通信状況をご確認ください',
  offline: 'オフラインです',
  noFavorites: 'お気に入りはまだありません。駐車場の詳細で ☆ を押すと登録できます',
  memoPlaceholder: '例：入口が狭い、最大料金あり',
  navigationUnavailable: 'この駐車場の座標が不正なため、ナビを開始できません',
} as const;

export function searchErrorMessage(kind: ProviderErrorKind | undefined): string {
  return kind === 'rate-limit' ? MESSAGES.rateLimited : MESSAGES.searchFailed;
}

export function geolocationErrorMessage(kind: GeolocationErrorKind): string {
  return kind === 'unsupported' ? MESSAGES.geolocationUnsupported : MESSAGES.geolocationFailed;
}
