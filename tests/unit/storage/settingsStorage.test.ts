import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from '@/storage/settingsStorage';
import { STORAGE_PREFIX } from '@/storage/storage';
import type { AppSettings } from '@/types/domain';

const DEFAULTS: AppSettings = {
  radiusM: 500,
  lastCenter: { lat: 34.393885, lng: 131.401059 },
  lastZoom: 15,
};

describe('settingsStorage', () => {
  it('保存した設定を読み込める', () => {
    const settings: AppSettings = {
      radiusM: 1000,
      lastCenter: { lat: 34.41, lng: 131.42 },
      lastZoom: 17,
    };

    saveSettings(settings);

    expect(loadSettings(DEFAULTS)).toEqual(settings);
  });

  it('保存されていない場合は既定値になる', () => {
    expect(loadSettings(DEFAULTS)).toEqual(DEFAULTS);
  });

  it('データが壊れている場合は既定値になる', () => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, '[[[');

    expect(loadSettings(DEFAULTS)).toEqual(DEFAULTS);
  });

  it('不正な項目だけが既定値に置き換わり、正しい項目は引き継がれる', () => {
    localStorage.setItem(
      `${STORAGE_PREFIX}settings`,
      JSON.stringify({ radiusM: 1000, lastCenter: { lat: 'x' }, lastZoom: 25 }),
    );

    expect(loadSettings(DEFAULTS)).toEqual({ ...DEFAULTS, radiusM: 1000 });
  });

  it('選択肢に無い半径は既定値に置き換わる', () => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify({ radiusM: 700 }));

    expect(loadSettings(DEFAULTS).radiusM).toBe(500);
  });
});
