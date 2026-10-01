/** 緯度・経度 */
export type LatLng = { lat: number; lng: number };

export type ParkingType = 'surface' | 'multi-storey' | 'underground' | 'rooftop' | 'unknown';

export type ParkingFee = 'yes' | 'no' | 'unknown';

export type ParkingSource = 'osm' | 'google';

/** 駐車場。提供元に依存しない共通のデータモデル */
export type ParkingLot = {
  /** 「提供元:種別/ID」形式の一意な ID（例：osm:way/123456） */
  id: string;
  source: ParkingSource;
  name?: string;
  location: LatLng;
  capacity?: number;
  parkingType: ParkingType;
  fee: ParkingFee;
  access?: string;
  operator?: string;
  openingHours?: string;
};

/** 周辺検索の結果。検索中心からの直線距離を持つ */
export type ParkingSearchResult = ParkingLot & { distanceM: number };

/** お気に入り。元データが変わっても地図へ移動できるよう、登録時点の名称と座標を持つ */
export type Favorite = {
  parkingId: string;
  name: string;
  location: LatLng;
  memo: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
};

/** 地名検索の候補地点 */
export type GeocodeResult = { label: string; location: LatLng };

export const SEARCH_RADII_M = [300, 500, 1000] as const;

export type SearchRadiusM = (typeof SEARCH_RADII_M)[number];

/** 次回起動時に引き継ぐ設定 */
export type AppSettings = {
  radiusM: SearchRadiusM;
  lastCenter: LatLng;
  lastZoom: number;
};
