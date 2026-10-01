import { FavoriteToggle } from '@/components/FavoriteToggle';
import { BackIcon } from '@/components/icons';
import { MemoEditor } from '@/components/MemoEditor';
import { NavigateButton } from '@/components/NavigateButton';
import type { Favorite, ParkingSearchResult } from '@/types/domain';
import { formatDistance } from '@/utils/distance';
import { getFeeLabel, getParkingName, getParkingTypeLabel } from '@/utils/parkingDisplay';

type ParkingDetailProps = {
  parking: ParkingSearchResult;
  favorite?: Favorite;
  onBack: () => void;
  onToggleFavorite: () => void;
  onMemoSave: (memo: string) => void;
};

export function ParkingDetail({
  parking,
  favorite,
  onBack,
  onToggleFavorite,
  onMemoSave,
}: ParkingDetailProps) {
  const rows: { label: string; value: string }[] = [
    { label: '種別', value: getParkingTypeLabel(parking.parkingType) },
    { label: '料金', value: getFeeLabel(parking.fee) },
  ];
  if (parking.capacity !== undefined) {
    rows.push({ label: '収容台数', value: `${parking.capacity}台` });
  }
  if (parking.openingHours !== undefined) {
    rows.push({ label: '営業時間', value: parking.openingHours });
  }
  if (parking.operator !== undefined) {
    rows.push({ label: '運営', value: parking.operator });
  }

  return (
    <section aria-labelledby="parking-detail-title" className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="一覧に戻る"
          className="-ml-3 flex size-11 shrink-0 items-center justify-center rounded-full active:bg-surface-muted"
        >
          <BackIcon />
        </button>
        <h2 id="parking-detail-title" className="min-w-0 flex-1 truncate text-lg font-bold">
          {getParkingName(parking)}
        </h2>
        <FavoriteToggle isFavorite={favorite !== undefined} onToggle={onToggleFavorite} />
      </div>

      <p className="text-sm text-muted">中心から {formatDistance(parking.distanceM)}（直線距離）</p>

      {/* 到着直前でもすぐ押せるよう、ナビのボタンは属性より上に置く */}
      <NavigateButton destination={parking.location} />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="break-words">{row.value}</dd>
          </div>
        ))}
      </dl>

      {favorite !== undefined && (
        <MemoEditor key={favorite.parkingId} initialMemo={favorite.memo} onSave={onMemoSave} />
      )}
    </section>
  );
}
