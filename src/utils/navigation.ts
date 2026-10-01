import type { LatLng } from '@/types/domain';
import { isValidLatLng } from '@/utils/validation';

/**
 * 駐車場を目的地として Google マップのナビを開く URL を生成する。
 * 座標が不正な場合は、URL に不正な値を埋め込まないよう undefined を返す。
 */
export function buildNavigationUrl(destination: LatLng): string | undefined {
  if (!isValidLatLng(destination)) {
    return undefined;
  }
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
