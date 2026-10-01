import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSettings, saveSettings } from '@/storage/settingsStorage';
import type { AppSettings } from '@/types/domain';

/** 地図の移動中は設定が頻繁に変わるため、この時間まとめてから保存する */
export const SAVE_DELAY_MS = 500;

export function useSettings(defaults: AppSettings) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(defaults));
  /** 保存が済んでいない最新の設定 */
  const pendingRef = useRef<AppSettings | undefined>(undefined);
  const isLoadedRef = useRef(false);

  const flush = useCallback(() => {
    if (pendingRef.current !== undefined) {
      saveSettings(pendingRef.current);
      pendingRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    // 読み込み直後は保存しない
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      return;
    }
    pendingRef.current = settings;
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [settings, flush]);

  // アプリを閉じる・切り替えるときは、待たずに保存する
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  return { settings, updateSettings };
}
