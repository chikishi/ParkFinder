import { useEffect, useRef } from 'react';
import { ParkingIcon, StarIcon } from '@/components/icons';
import type { ParkingSearchResult } from '@/types/domain';
import { formatDistance } from '@/utils/distance';
import { getParkingName, summarizeParkingLot } from '@/utils/parkingDisplay';

type ParkingListItemProps = {
  parking: ParkingSearchResult;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
};

export function ParkingListItem({
  parking,
  isSelected,
  isFavorite,
  onSelect,
}: ParkingListItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 地図のマーカーで選ばれたときも、一覧の該当項目が見えるようにする
  useEffect(() => {
    if (isSelected) {
      buttonRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <li>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onSelect(parking.id)}
        aria-current={isSelected ? 'true' : undefined}
        className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left ${
          isSelected ? 'bg-primary/10' : 'active:bg-surface-muted'
        }`}
      >
        <ParkingIcon className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate font-medium">{getParkingName(parking)}</span>
            {isFavorite && (
              <>
                <StarIcon filled className="size-4 shrink-0 text-favorite" />
                <span className="sr-only">（お気に入り）</span>
              </>
            )}
          </span>
          <span className="block text-sm text-muted">{summarizeParkingLot(parking)}</span>
        </span>
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {formatDistance(parking.distanceM)}
        </span>
      </button>
    </li>
  );
}
