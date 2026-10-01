import { lazy } from 'react';
import type { AppConfig } from '@/config';
import { NominatimGeocodingProvider } from '@/providers/osm/nominatimGeocodingProvider';
import { OverpassParkingProvider } from '@/providers/osm/overpassParkingProvider';
import type { GeocodingProvider, ParkingProvider } from '@/providers/types';

// 提供元を選ぶ処理はこのファイルにまとめる。Google 対応時は config.provider で分岐する

export function createParkingProvider(config: AppConfig): ParkingProvider {
  return new OverpassParkingProvider(config.overpassUrl);
}

export function createGeocodingProvider(config: AppConfig): GeocodingProvider {
  return new NominatimGeocodingProvider(config.nominatimUrl);
}

/**
 * 提供元の地図コンポーネント。地図ライブラリは大きいため遅延読み込みし、
 * 選ばれなかった提供元のライブラリを最初に読み込むコードに含めない
 */
export const MapView = lazy(() =>
  import('@/providers/osm/LeafletMapView').then((module) => ({ default: module.LeafletMapView })),
);
