import { readJson, writeJson } from '@/storage/storage';
import type { AppSettings } from '@/types/domain';
import { isSearchRadius, isValidLatLng } from '@/utils/validation';

const KEY = 'settings';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isZoom(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 19;
}

/**
 * 設定を読み込む。項目ごとに検証し、不正な項目だけを既定値に置き換える
 * （1 項目が壊れていても、他の項目は引き継ぐため）。
 */
export function loadSettings(defaults: AppSettings): AppSettings {
  const stored = readJson(KEY, isRecord, {});
  return {
    radiusM: isSearchRadius(stored.radiusM) ? stored.radiusM : defaults.radiusM,
    lastCenter: isValidLatLng(stored.lastCenter) ? stored.lastCenter : defaults.lastCenter,
    lastZoom: isZoom(stored.lastZoom) ? stored.lastZoom : defaults.lastZoom,
  };
}

export function saveSettings(settings: AppSettings): boolean {
  return writeJson(KEY, settings);
}
