import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { NominatimGeocodingProvider } from '@/providers/osm/nominatimGeocodingProvider';
import { TEST_NOMINATIM_URL, nominatimHandler } from '../../../mocks/handlers';
import { server } from '../../../mocks/server';

describe('NominatimGeocodingProvider', () => {
  const provider = new NominatimGeocodingProvider(TEST_NOMINATIM_URL);

  it('日本国内・日本語・最大 5 件の条件で検索する', async () => {
    let receivedUrl: URL | undefined;
    server.use(
      http.get(`${TEST_NOMINATIM_URL}/search`, ({ request }) => {
        receivedUrl = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );

    await provider.search('萩駅 & 周辺');

    expect(receivedUrl?.searchParams.get('q')).toBe('萩駅 & 周辺');
    expect(receivedUrl?.searchParams.get('format')).toBe('jsonv2');
    expect(receivedUrl?.searchParams.get('countrycodes')).toBe('jp');
    expect(receivedUrl?.searchParams.get('accept-language')).toBe('ja');
    expect(receivedUrl?.searchParams.get('limit')).toBe('5');
  });

  it('表示名と数値に変換した座標を返し、座標が不正な候補は捨てる', async () => {
    const results = await provider.search('萩駅');

    expect(results).toEqual([
      {
        label: '萩駅, 萩三隅線, 椿, 萩市, 山口県, 758-0062, 日本',
        location: { lat: 34.3938852, lng: 131.4010588 },
      },
      { label: '東萩駅, 萩市, 山口県, 日本', location: { lat: 34.4127, lng: 131.4153 } },
    ]);
  });

  it('応答が配列でない場合は invalid-response のエラーになる', async () => {
    server.use(nominatimHandler({ error: 'unexpected' }));

    await expect(provider.search('萩駅')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('HTTP 429 の場合は rate-limit のエラーになる', async () => {
    server.use(nominatimHandler(null, { status: 429 }));

    await expect(provider.search('萩駅')).rejects.toMatchObject({ kind: 'rate-limit' });
  });
});
