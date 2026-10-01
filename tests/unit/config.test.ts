import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/config';

describe('loadConfig', () => {
  it('環境変数が無い場合は既定値（萩駅・ズーム 15）になる', () => {
    const config = loadConfig({});

    expect(config.provider).toBe('osm');
    expect(config.defaultCenter).toEqual({ lat: 34.393885, lng: 131.401059 });
    expect(config.defaultZoom).toBe(15);
    expect(config.overpassUrl).toBe('https://overpass-api.de/api/interpreter');
    expect(config.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
  });

  it('環境変数の値が使われる', () => {
    const config = loadConfig({
      VITE_OVERPASS_URL: 'https://overpass.example.com/api/interpreter',
      VITE_NOMINATIM_URL: 'https://nominatim.example.com/',
      VITE_DEFAULT_CENTER: '34.5,131.5',
      VITE_DEFAULT_ZOOM: '13',
    });

    expect(config.overpassUrl).toBe('https://overpass.example.com/api/interpreter');
    expect(config.nominatimUrl).toBe('https://nominatim.example.com');
    expect(config.defaultCenter).toEqual({ lat: 34.5, lng: 131.5 });
    expect(config.defaultZoom).toBe(13);
  });

  it('不正な値は既定値に置き換えられる', () => {
    const config = loadConfig({
      VITE_OVERPASS_URL: 'http://insecure.example.com',
      VITE_NOMINATIM_URL: 'not a url',
      VITE_DEFAULT_CENTER: 'abc',
      VITE_DEFAULT_ZOOM: '30',
    });

    expect(config.overpassUrl).toBe('https://overpass-api.de/api/interpreter');
    expect(config.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
    expect(config.defaultCenter).toEqual({ lat: 34.393885, lng: 131.401059 });
    expect(config.defaultZoom).toBe(15);
  });
});
