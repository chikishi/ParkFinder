import type { LatLng } from '@/types/domain';

/** 地球の平均半径（メートル） */
const EARTH_RADIUS_M = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** 2 地点間の直線距離（メートル）をハーバーサイン式で計算し、整数に丸める */
export function calcDistanceM(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_M * c);
}

/** 距離を表示用の文字列にする（1km 未満は m、以上は小数 1 桁の km） */
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) {
    return `${distanceM}m`;
  }
  return `${(distanceM / 1000).toFixed(1)}km`;
}
