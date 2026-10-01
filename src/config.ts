import type { LatLng } from '@/types/domain';
import { parseLatLng } from '@/utils/validation';

export type ProviderName = 'osm';

export type AppConfig = {
  provider: ProviderName;
  overpassUrl: string;
  nominatimUrl: string;
  defaultCenter: LatLng;
  defaultZoom: number;
};

/** 萩駅 */
const DEFAULT_CENTER: LatLng = { lat: 34.393885, lng: 131.401059 };
const DEFAULT_ZOOM = 15;
const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

function parseHttpsUrl(text: string | undefined, fallback: string): string {
  if (text === undefined || text === '') {
    return fallback;
  }
  try {
    const url = new URL(text);
    return url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : fallback;
  } catch {
    return fallback;
  }
}

function parseZoom(text: string | undefined): number {
  const zoom = Number(text);
  return Number.isInteger(zoom) && zoom >= 1 && zoom <= 19 ? zoom : DEFAULT_ZOOM;
}

type EnvLike = Partial<Record<keyof ImportMetaEnv, string | undefined>>;

/** 環境変数から設定を作る。不正な値は既定値に置き換える */
export function loadConfig(env: EnvLike): AppConfig {
  return {
    // 現在対応している提供元は osm だけ。Google 対応時にここで分岐する
    provider: 'osm',
    overpassUrl: parseHttpsUrl(env.VITE_OVERPASS_URL, DEFAULT_OVERPASS_URL),
    nominatimUrl: parseHttpsUrl(env.VITE_NOMINATIM_URL, DEFAULT_NOMINATIM_URL),
    defaultCenter: parseLatLng(env.VITE_DEFAULT_CENTER ?? '') ?? DEFAULT_CENTER,
    defaultZoom: parseZoom(env.VITE_DEFAULT_ZOOM),
  };
}

export const appConfig: AppConfig = loadConfig(import.meta.env);
