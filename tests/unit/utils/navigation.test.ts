import { describe, expect, it } from 'vitest';
import { buildNavigationUrl } from '@/utils/navigation';

describe('buildNavigationUrl', () => {
  it('目的地の座標と車での移動を指定した Google マップの URL になる', () => {
    const url = buildNavigationUrl({ lat: 34.393885, lng: 131.401059 });

    expect(url).toBeDefined();
    const parsed = new URL(url ?? '');
    expect(parsed.origin + parsed.pathname).toBe('https://www.google.com/maps/dir/');
    expect(parsed.searchParams.get('api')).toBe('1');
    expect(parsed.searchParams.get('destination')).toBe('34.393885,131.401059');
    expect(parsed.searchParams.get('travelmode')).toBe('driving');
  });

  it('座標が不正な場合は undefined になる', () => {
    expect(buildNavigationUrl({ lat: 100, lng: 131 })).toBeUndefined();
    expect(buildNavigationUrl({ lat: Number.NaN, lng: 131 })).toBeUndefined();
  });
});
