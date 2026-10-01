import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_DELAY_MS, useSettings } from '@/hooks/useSettings';
import { loadSettings, saveSettings } from '@/storage/settingsStorage';
import type { AppSettings } from '@/types/domain';

const DEFAULTS: AppSettings = {
  radiusM: 500,
  lastCenter: { lat: 34.393885, lng: 131.401059 },
  lastZoom: 15,
};

describe('useSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('保存された設定が無い場合は既定値になる', () => {
    const { result } = renderHook(() => useSettings(DEFAULTS));

    expect(result.current.settings).toEqual(DEFAULTS);
  });

  it('保存された設定が読み込まれる', () => {
    saveSettings({ ...DEFAULTS, radiusM: 1000 });

    const { result } = renderHook(() => useSettings(DEFAULTS));

    expect(result.current.settings.radiusM).toBe(1000);
  });

  it('変更はすぐに反映され、保存は 500ms 後にまとめて行われる', () => {
    const { result } = renderHook(() => useSettings(DEFAULTS));

    act(() => result.current.updateSettings({ lastZoom: 16 }));
    act(() => result.current.updateSettings({ lastZoom: 17 }));

    expect(result.current.settings.lastZoom).toBe(17);
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(loadSettings(DEFAULTS).lastZoom).toBe(15);
    act(() => vi.advanceTimersByTime(1));
    expect(loadSettings(DEFAULTS).lastZoom).toBe(17);
  });

  it('ページを離れるときは、待たずに保存される', () => {
    const { result } = renderHook(() => useSettings(DEFAULTS));
    act(() => result.current.updateSettings({ radiusM: 300 }));

    window.dispatchEvent(new Event('pagehide'));

    expect(loadSettings(DEFAULTS).radiusM).toBe(300);
  });

  it('アンマウント時にも、保存されていない変更が保存される', () => {
    const { result, unmount } = renderHook(() => useSettings(DEFAULTS));
    act(() => result.current.updateSettings({ radiusM: 1000 }));

    unmount();

    expect(loadSettings(DEFAULTS).radiusM).toBe(1000);
  });
});
