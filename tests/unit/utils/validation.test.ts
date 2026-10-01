import { describe, expect, it } from 'vitest';
import {
  MAX_MEMO_LENGTH,
  MAX_QUERY_LENGTH,
  isSearchRadius,
  isValidLatLng,
  normalizeQuery,
  parseLatLng,
  truncateMemo,
} from '@/utils/validation';

describe('isValidLatLng', () => {
  it('範囲内の緯度・経度は有効', () => {
    expect(isValidLatLng({ lat: 34.39, lng: 131.4 })).toBe(true);
  });

  it('境界値（±90、±180）は有効', () => {
    expect(isValidLatLng({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidLatLng({ lat: -90, lng: -180 })).toBe(true);
  });

  it('範囲外の緯度・経度は無効', () => {
    expect(isValidLatLng({ lat: 90.1, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: -180.1 })).toBe(false);
  });

  it('数値でない値や NaN・Infinity は無効', () => {
    expect(isValidLatLng({ lat: '34', lng: 131 })).toBe(false);
    expect(isValidLatLng({ lat: Number.NaN, lng: 131 })).toBe(false);
    expect(isValidLatLng({ lat: 34, lng: Number.POSITIVE_INFINITY })).toBe(false);
  });

  it('オブジェクトでない値や項目が欠けた値は無効', () => {
    expect(isValidLatLng(null)).toBe(false);
    expect(isValidLatLng('34,131')).toBe(false);
    expect(isValidLatLng({ lat: 34 })).toBe(false);
  });
});

describe('isSearchRadius', () => {
  it('300・500・1000 は有効', () => {
    expect(isSearchRadius(300)).toBe(true);
    expect(isSearchRadius(500)).toBe(true);
    expect(isSearchRadius(1000)).toBe(true);
  });

  it('それ以外の値は無効', () => {
    expect(isSearchRadius(400)).toBe(false);
    expect(isSearchRadius('500')).toBe(false);
  });
});

describe('parseLatLng', () => {
  it('「緯度,経度」形式を解析できる', () => {
    expect(parseLatLng('34.393885,131.401059')).toEqual({ lat: 34.393885, lng: 131.401059 });
  });

  it('前後の空白は無視される', () => {
    expect(parseLatLng(' 34.5 , 131.5 ')).toEqual({ lat: 34.5, lng: 131.5 });
  });

  it('形式が不正な場合は undefined になる', () => {
    expect(parseLatLng('')).toBeUndefined();
    expect(parseLatLng('34.5')).toBeUndefined();
    expect(parseLatLng('34.5,')).toBeUndefined();
    expect(parseLatLng('a,b')).toBeUndefined();
    expect(parseLatLng('1,2,3')).toBeUndefined();
    expect(parseLatLng('91,0')).toBeUndefined();
  });
});

describe('normalizeQuery', () => {
  it('前後の空白が除去される', () => {
    expect(normalizeQuery('  萩駅  ')).toBe('萩駅');
  });

  it('空白だけの入力は undefined になる', () => {
    expect(normalizeQuery('')).toBeUndefined();
    expect(normalizeQuery('   ')).toBeUndefined();
  });

  it('上限文字数を超えた分は切り詰められる', () => {
    const text = 'あ'.repeat(MAX_QUERY_LENGTH + 10);

    expect(normalizeQuery(text)).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe('truncateMemo', () => {
  it('上限以内のメモはそのまま返る', () => {
    expect(truncateMemo('入口が狭い')).toBe('入口が狭い');
  });

  it('上限を超えた分は切り詰められる', () => {
    expect(truncateMemo('a'.repeat(MAX_MEMO_LENGTH + 1))).toHaveLength(MAX_MEMO_LENGTH);
  });
});
