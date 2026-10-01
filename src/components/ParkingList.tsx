import { ErrorMessage } from '@/components/ErrorMessage';
import { MESSAGES, searchErrorMessage } from '@/components/messages';
import { ParkingListItem } from '@/components/ParkingListItem';
import { RadiusSelector } from '@/components/RadiusSelector';
import type { SearchStatus } from '@/hooks/useParkingSearch';
import type { ProviderErrorKind } from '@/providers/types';
import { SEARCH_RADII_M, type ParkingSearchResult, type SearchRadiusM } from '@/types/domain';

type ParkingListProps = {
  status: SearchStatus;
  results: ParkingSearchResult[];
  errorKind?: ProviderErrorKind;
  radiusM: SearchRadiusM;
  selectedId?: string;
  isFavorite: (parkingId: string) => boolean;
  onSelect: (id: string) => void;
  onRadiusChange: (radiusM: SearchRadiusM) => void;
  onRetry: () => void;
};

export function ParkingList({
  status,
  results,
  errorKind,
  radiusM,
  selectedId,
  isFavorite,
  onSelect,
  onRadiusChange,
  onRetry,
}: ParkingListProps) {
  const largerRadius = SEARCH_RADII_M.find((candidate) => candidate > radiusM);

  return (
    <div>
      <div className="px-4 pb-2">
        <RadiusSelector value={radiusM} onChange={onRadiusChange} />
      </div>

      {status === 'loading' && (
        <p role="status" className="px-4 py-6 text-center text-muted">
          {MESSAGES.searching}
        </p>
      )}

      {status === 'error' && (
        <ErrorMessage
          message={searchErrorMessage(errorKind)}
          actionLabel={MESSAGES.retry}
          onAction={onRetry}
        />
      )}

      {status === 'success' && results.length === 0 && (
        <ErrorMessage
          tone="info"
          message={MESSAGES.noResults}
          actionLabel={largerRadius !== undefined ? MESSAGES.expandRadius : undefined}
          onAction={largerRadius !== undefined ? () => onRadiusChange(largerRadius) : undefined}
        />
      )}

      {/* 件数はボトムシートの見出しに表示する */}
      {status === 'success' && results.length > 0 && (
        <ul aria-label="駐車場一覧" className="divide-y divide-border">
          {results.map((parking) => (
            <ParkingListItem
              key={parking.id}
              parking={parking}
              isSelected={parking.id === selectedId}
              isFavorite={isFavorite(parking.id)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
