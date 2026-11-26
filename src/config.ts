import type { LatLng } from '@/types/domain';
import { parseLatLng } from '@/utils/validation';

export type ProviderName = 'osm';

export type AppConfig = {
  provider: ProviderName;
  /** 1 件以上。先頭から順に試す */
  overpassUrls: string[];
  nominatimUrl: string;
  defaultCenter: LatLng;
  defaultZoom: number;
};

/** 萩駅 */
const DEFAULT_CENTER: LatLng = { lat: 34.393885, lng: 131.401059 };
const DEFAULT_ZOOM = 15;
/**
 * 既定の Overpass の検索先。先頭から順に試す。
 * 公式（overpass-api.de）は混雑して応答しないことが多いため、ブラウザから使えることを確かめた maps.mail.ru を先にする
 */
const DEFAULT_OVERPASS_URLS: readonly string[] = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
/** 混雑時に何か所も試して利用者を長く待たせないよう、検索先の数を制限する */
const MAX_OVERPASS_URLS = 3;

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

/** カンマ区切りの URL を解析する。不正な URL と重複は除き、1 件も残らなければ既定値を使う */
export function parseHttpsUrls(text: string | undefined, fallback: readonly string[]): string[] {
  const urls = (text ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => parseHttpsUrl(part, ''))
    .filter((url) => url !== '');
  const uniqueUrls = [...new Set(urls)].slice(0, MAX_OVERPASS_URLS);
  return uniqueUrls.length > 0 ? uniqueUrls : [...fallback];
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
    overpassUrls: parseHttpsUrls(env.VITE_OVERPASS_URL, DEFAULT_OVERPASS_URLS),
    nominatimUrl: parseHttpsUrl(env.VITE_NOMINATIM_URL, DEFAULT_NOMINATIM_URL),
    defaultCenter: parseLatLng(env.VITE_DEFAULT_CENTER ?? '') ?? DEFAULT_CENTER,
    defaultZoom: parseZoom(env.VITE_DEFAULT_ZOOM),
  };
}

export const appConfig: AppConfig = loadConfig(import.meta.env);
