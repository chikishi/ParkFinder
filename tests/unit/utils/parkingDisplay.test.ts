import { describe, expect, it } from 'vitest';
import type { ParkingLot } from '@/types/domain';
import {
  getFeeLabel,
  getParkingName,
  getParkingTypeLabel,
  summarizeParkingLot,
} from '@/utils/parkingDisplay';

const PARKING: ParkingLot = {
  id: 'osm:node/1',
  source: 'osm',
  name: '椿立体駐車場',
  location: { lat: 34.39, lng: 131.4 },
  parkingType: 'multi-storey',
  fee: 'yes',
  capacity: 50,
};

describe('parkingDisplay', () => {
  it('名称が無い駐車場は「名称不明の駐車場」になる', () => {
    expect(getParkingName(PARKING)).toBe('椿立体駐車場');
    expect(getParkingName({ name: undefined })).toBe('名称不明の駐車場');
  });

  it('種別と料金区分が日本語の表示になる', () => {
    expect(getParkingTypeLabel('surface')).toBe('平面');
    expect(getParkingTypeLabel('multi-storey')).toBe('立体');
    expect(getParkingTypeLabel('underground')).toBe('地下');
    expect(getParkingTypeLabel('rooftop')).toBe('屋上');
    expect(getParkingTypeLabel('unknown')).toBe('種別不明');
    expect(getFeeLabel('yes')).toBe('有料');
    expect(getFeeLabel('no')).toBe('無料');
    expect(getFeeLabel('unknown')).toBe('料金不明');
  });

  it('要約は「種別 / 料金 / 台数」の形式になる', () => {
    expect(summarizeParkingLot(PARKING)).toBe('立体 / 有料 / 50台');
  });

  it('収容台数が無い場合は台数を省略する', () => {
    expect(summarizeParkingLot({ ...PARKING, capacity: undefined })).toBe('立体 / 有料');
  });
});
