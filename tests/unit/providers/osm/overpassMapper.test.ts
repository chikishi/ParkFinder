import { describe, expect, it } from 'vitest';
import { toParkingLot, toParkingLots } from '@/providers/osm/overpassMapper';
import overpassMalformed from '../../../fixtures/overpass-malformed.json';
import overpassParking from '../../../fixtures/overpass-parking.json';

describe('toParkingLot', () => {
  it('way は中心座標を使い、タグの値が各項目に変換される', () => {
    const parkingLot = toParkingLot(overpassParking.elements[0]);

    expect(parkingLot).toEqual({
      id: 'osm:way/1001',
      source: 'osm',
      name: '萩駅前パーキング',
      location: { lat: 34.39575, lng: 131.40106 },
      capacity: 24,
      parkingType: 'surface',
      fee: 'yes',
      access: undefined,
      operator: 'テスト駐車場株式会社',
      openingHours: '24/7',
    });
  });

  it('node は自身の座標を使う', () => {
    const parkingLot = toParkingLot(overpassParking.elements[1]);

    expect(parkingLot?.id).toBe('osm:node/1002');
    expect(parkingLot?.location).toEqual({ lat: 34.39299, lng: 131.40106 });
    expect(parkingLot?.parkingType).toBe('multi-storey');
    expect(parkingLot?.fee).toBe('no');
  });

  it('タグが無い場合は名称が未設定、種別・料金区分が unknown になる', () => {
    const parkingLot = toParkingLot(overpassParking.elements[2]);

    expect(parkingLot?.name).toBeUndefined();
    expect(parkingLot?.capacity).toBeUndefined();
    expect(parkingLot?.parkingType).toBe('unknown');
    expect(parkingLot?.fee).toBe('unknown');
  });

  it('条件付きの料金は unknown になる', () => {
    const parkingLot = toParkingLot(overpassParking.elements[4]);

    expect(parkingLot?.id).toBe('osm:relation/1005');
    expect(parkingLot?.fee).toBe('unknown');
    expect(parkingLot?.parkingType).toBe('underground');
  });

  it('想定外の種別は unknown になる', () => {
    const parkingLot = toParkingLot({
      type: 'node',
      id: 1,
      lat: 34,
      lon: 131,
      tags: { parking: 'street_side' },
    });

    expect(parkingLot?.parkingType).toBe('unknown');
  });

  it('収容台数が正の整数でない場合は未設定になる', () => {
    const base = { type: 'node', id: 1, lat: 34, lon: 131 };

    expect(toParkingLot({ ...base, tags: { capacity: 'approx 30' } })?.capacity).toBeUndefined();
    expect(toParkingLot({ ...base, tags: { capacity: '0' } })?.capacity).toBeUndefined();
    expect(toParkingLot({ ...base, tags: { capacity: '-5' } })?.capacity).toBeUndefined();
  });

  it('名称の前後の空白は除去され、空白だけの名称は未設定になる', () => {
    const base = { type: 'node', id: 1, lat: 34, lon: 131 };

    expect(toParkingLot({ ...base, tags: { name: '  P1  ' } })?.name).toBe('P1');
    expect(toParkingLot({ ...base, tags: { name: '   ' } })?.name).toBeUndefined();
  });

  it('形式が不正な要素は undefined になる', () => {
    const [, noCenter, areaType, stringId, outOfRange, text, nullElement] =
      overpassMalformed.elements;

    expect(toParkingLot(noCenter)).toBeUndefined();
    expect(toParkingLot(areaType)).toBeUndefined();
    expect(toParkingLot(stringId)).toBeUndefined();
    expect(toParkingLot(outOfRange)).toBeUndefined();
    expect(toParkingLot(text)).toBeUndefined();
    expect(toParkingLot(nullElement)).toBeUndefined();
  });
});

describe('toParkingLots', () => {
  it('すべての要素が変換される', () => {
    expect(toParkingLots(overpassParking)).toHaveLength(5);
  });

  it('不正な要素だけが捨てられる', () => {
    const parkingLots = toParkingLots(overpassMalformed);

    expect(parkingLots?.map((parkingLot) => parkingLot.id)).toEqual(['osm:node/2001']);
  });

  it('elements が配列でない応答は undefined になる', () => {
    expect(toParkingLots({ elements: 'x' })).toBeUndefined();
    expect(toParkingLots(null)).toBeUndefined();
    expect(toParkingLots([])).toBeUndefined();
  });
});
