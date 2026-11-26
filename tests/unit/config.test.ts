import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/config';

/** 既定の Overpass の検索先（先頭から順に試す） */
const DEFAULT_OVERPASS_URLS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

describe('loadConfig', () => {
  it('環境変数が無い場合は既定値（萩駅・ズーム 15）になる', () => {
    const config = loadConfig({});

    expect(config.provider).toBe('osm');
    expect(config.defaultCenter).toEqual({ lat: 34.393885, lng: 131.401059 });
    expect(config.defaultZoom).toBe(15);
    expect(config.overpassUrls).toEqual(DEFAULT_OVERPASS_URLS);
    expect(config.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
  });

  it('環境変数の値が使われる', () => {
    const config = loadConfig({
      VITE_OVERPASS_URL: 'https://overpass.example.com/api/interpreter',
      VITE_NOMINATIM_URL: 'https://nominatim.example.com/',
      VITE_DEFAULT_CENTER: '34.5,131.5',
      VITE_DEFAULT_ZOOM: '13',
    });

    expect(config.overpassUrls).toEqual(['https://overpass.example.com/api/interpreter']);
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

    expect(config.overpassUrls).toEqual(DEFAULT_OVERPASS_URLS);
    expect(config.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
    expect(config.defaultCenter).toEqual({ lat: 34.393885, lng: 131.401059 });
    expect(config.defaultZoom).toBe(15);
  });

  it('Overpass の検索先はカンマ区切りで複数指定でき、前後の空白は除かれる', () => {
    const config = loadConfig({
      VITE_OVERPASS_URL:
        ' https://a.example.com/api/interpreter , https://b.example.com/api/interpreter ',
    });

    expect(config.overpassUrls).toEqual([
      'https://a.example.com/api/interpreter',
      'https://b.example.com/api/interpreter',
    ]);
  });

  it('Overpass の検索先は、不正な URL と重複を除き、最大 3 件までになる', () => {
    const config = loadConfig({
      VITE_OVERPASS_URL: [
        'https://a.example.com/api/interpreter',
        'http://insecure.example.com',
        'not a url',
        'https://a.example.com/api/interpreter/',
        'https://b.example.com/api/interpreter',
        'https://c.example.com/api/interpreter',
        'https://d.example.com/api/interpreter',
      ].join(','),
    });

    expect(config.overpassUrls).toEqual([
      'https://a.example.com/api/interpreter',
      'https://b.example.com/api/interpreter',
      'https://c.example.com/api/interpreter',
    ]);
  });

  it('Overpass の検索先がすべて不正な場合は既定値になる', () => {
    const config = loadConfig({ VITE_OVERPASS_URL: 'http://a.example.com, ,not a url' });

    expect(config.overpassUrls).toEqual(DEFAULT_OVERPASS_URLS);
  });
});
