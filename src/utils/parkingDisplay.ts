import type { ParkingFee, ParkingLot, ParkingType } from '@/types/domain';

/** 駐車場名が無い場合の表示名（docs/glossary.md） */
export const UNNAMED_PARKING_NAME = '名称不明の駐車場';

export function getParkingName(parkingLot: Pick<ParkingLot, 'name'>): string {
  return parkingLot.name ?? UNNAMED_PARKING_NAME;
}

const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  surface: '平面',
  'multi-storey': '立体',
  underground: '地下',
  rooftop: '屋上',
  unknown: '種別不明',
};

const FEE_LABELS: Record<ParkingFee, string> = {
  yes: '有料',
  no: '無料',
  unknown: '料金不明',
};

export function getParkingTypeLabel(parkingType: ParkingType): string {
  return PARKING_TYPE_LABELS[parkingType];
}

export function getFeeLabel(fee: ParkingFee): string {
  return FEE_LABELS[fee];
}

/** 一覧に表示する属性の要約（例：「立体 / 有料 / 50台」） */
export function summarizeParkingLot(parkingLot: ParkingLot): string {
  const parts = [getParkingTypeLabel(parkingLot.parkingType), getFeeLabel(parkingLot.fee)];
  if (parkingLot.capacity !== undefined) {
    parts.push(`${parkingLot.capacity}台`);
  }
  return parts.join(' / ');
}
