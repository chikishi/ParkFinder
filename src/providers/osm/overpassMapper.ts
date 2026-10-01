import type { ParkingFee, ParkingLot, ParkingType } from '@/types/domain';
import { isFiniteNumber, isValidLatLng } from '@/utils/validation';

type OsmElementType = 'node' | 'way' | 'relation';

const PARKING_TYPES: readonly ParkingType[] = [
  'surface',
  'multi-storey',
  'underground',
  'rooftop',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOsmElementType(value: unknown): value is OsmElementType {
  return value === 'node' || value === 'way' || value === 'relation';
}

function readString(tags: Record<string, unknown>, key: string): string | undefined {
  const value = tags[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function toParkingType(value: string | undefined): ParkingType {
  return PARKING_TYPES.find((type) => type === value) ?? 'unknown';
}

function toFee(value: string | undefined): ParkingFee {
  // 「yes」「no」以外（時間帯による条件付きなど）は判断できないため不明とする
  return value === 'yes' || value === 'no' ? value : 'unknown';
}

function toCapacity(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) {
    return undefined;
  }
  const capacity = Number(value);
  return capacity > 0 ? capacity : undefined;
}

/** Overpass の要素 1 件を ParkingLot に変換する。形式が不正な場合は undefined を返す */
export function toParkingLot(element: unknown): ParkingLot | undefined {
  if (!isRecord(element)) {
    return undefined;
  }
  const { type, id } = element;
  if (!isOsmElementType(type) || !isFiniteNumber(id)) {
    return undefined;
  }

  // node は自身の座標、way・relation は `out center` で付与される中心座標を使う
  const coordinates = type === 'node' ? element : element.center;
  if (!isRecord(coordinates)) {
    return undefined;
  }
  const location = { lat: coordinates.lat, lng: coordinates.lon };
  if (!isValidLatLng(location)) {
    return undefined;
  }

  const tags = isRecord(element.tags) ? element.tags : {};
  return {
    id: `osm:${type}/${id}`,
    source: 'osm',
    name: readString(tags, 'name'),
    location,
    capacity: toCapacity(readString(tags, 'capacity')),
    parkingType: toParkingType(readString(tags, 'parking')),
    fee: toFee(readString(tags, 'fee')),
    access: readString(tags, 'access'),
    operator: readString(tags, 'operator'),
    openingHours: readString(tags, 'opening_hours'),
  };
}

/** Overpass の応答全体を ParkingLot の配列に変換する。応答の形式が不正な場合は undefined を返す */
export function toParkingLots(response: unknown): ParkingLot[] | undefined {
  if (!isRecord(response) || !Array.isArray(response.elements)) {
    return undefined;
  }
  // 不正な要素は、その要素だけを捨てる
  return response.elements.flatMap((element: unknown) => toParkingLot(element) ?? []);
}
