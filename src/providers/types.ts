import type { GeocodeResult, LatLng, ParkingLot } from '@/types/domain';

/** 駐車場データの提供元 */
export interface ParkingProvider {
  /** center から radiusM メートル以内の駐車場を取得する（並べ替えはサービス層で行う） */
  searchNearby(center: LatLng, radiusM: number, signal?: AbortSignal): Promise<ParkingLot[]>;
}

/** 地名検索（ジオコーディング）の提供元 */
export interface GeocodingProvider {
  /** 地名・住所から候補地点を取得する */
  search(query: string, signal?: AbortSignal): Promise<GeocodeResult[]>;
}

/** 地図上の駐車場マーカー */
export type MapMarker = { id: string; location: LatLng; label: string };

/** 地図コンポーネントの props（提供元ごとの実装で共通） */
export type MapViewProps = {
  center: LatLng;
  zoom: number;
  /** 地図下部がボトムシートで隠れている高さ（px）。中心をこの分だけ上にずらして表示する */
  bottomInsetPx: number;
  searchCenter?: LatLng;
  searchRadiusM?: number;
  markers: MapMarker[];
  selectedId?: string;
  userLocation?: LatLng;
  onMapClick: (location: LatLng) => void;
  onMarkerClick: (id: string) => void;
  onViewChange: (center: LatLng, zoom: number) => void;
};

export type ProviderErrorKind =
  'network' | 'timeout' | 'rate-limit' | 'invalid-response' | 'aborted';

/** プロバイダ層が投げるエラー。フックは kind を返し、画面の文言への変換はコンポーネントで行う */
export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;

  constructor(kind: ProviderErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ProviderError';
    this.kind = kind;
  }
}

export function isAbortedError(error: unknown): boolean {
  return error instanceof ProviderError && error.kind === 'aborted';
}
