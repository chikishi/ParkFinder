import { fetchJson } from '@/providers/fetchJson';
import { ProviderError, type GeocodingProvider } from '@/providers/types';
import type { GeocodeResult } from '@/types/domain';
import { isValidLatLng } from '@/utils/validation';

const TIMEOUT_MS = 10_000;
const MAX_RESULTS = 5;

function toGeocodeResult(item: unknown): GeocodeResult | undefined {
  if (typeof item !== 'object' || item === null) {
    return undefined;
  }
  const label = 'display_name' in item ? item.display_name : undefined;
  const lat = 'lat' in item ? Number(item.lat) : Number.NaN;
  const lng = 'lon' in item ? Number(item.lon) : Number.NaN;
  const location = { lat, lng };
  if (typeof label !== 'string' || label === '' || !isValidLatLng(location)) {
    return undefined;
  }
  return { label, location };
}

export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async search(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: query,
      countrycodes: 'jp',
      'accept-language': 'ja',
      limit: String(MAX_RESULTS),
    });
    const json = await fetchJson(`${this.baseUrl}/search?${params.toString()}`, {
      signal,
      timeoutMs: TIMEOUT_MS,
    });

    if (!Array.isArray(json)) {
      throw new ProviderError('invalid-response', 'Nominatim の応答の形式が不正です');
    }
    return json.flatMap((item: unknown) => toGeocodeResult(item) ?? []);
  }
}
