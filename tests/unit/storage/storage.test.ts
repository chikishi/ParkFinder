import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_PREFIX, readJson, writeJson } from '@/storage/storage';

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');

describe('readJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('保存した値を読み込める', () => {
    localStorage.setItem(`${STORAGE_PREFIX}numbers`, '[1,2,3]');

    expect(readJson('numbers', isNumberArray, [])).toEqual([1, 2, 3]);
  });

  it('値が無い場合は fallback を返す', () => {
    expect(readJson('numbers', isNumberArray, [0])).toEqual([0]);
  });

  it('壊れた JSON の場合は fallback を返す', () => {
    localStorage.setItem(`${STORAGE_PREFIX}numbers`, '{壊れた');

    expect(readJson('numbers', isNumberArray, [0])).toEqual([0]);
  });

  it('型が合わない場合は fallback を返す', () => {
    localStorage.setItem(`${STORAGE_PREFIX}numbers`, '["a"]');

    expect(readJson('numbers', isNumberArray, [0])).toEqual([0]);
  });

  it('localStorage へのアクセスが例外になる場合は fallback を返す', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(readJson('numbers', isNumberArray, [0])).toEqual([0]);
  });
});

describe('writeJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('接頭辞付きのキーで JSON として保存し、true を返す', () => {
    expect(writeJson('numbers', [1, 2])).toBe(true);

    expect(localStorage.getItem(`${STORAGE_PREFIX}numbers`)).toBe('[1,2]');
  });

  it('容量超過などで保存に失敗した場合は、例外を出さずに false を返す', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });

    expect(writeJson('numbers', [1])).toBe(false);
  });
});
