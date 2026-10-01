import { SEARCH_RADII_M, type SearchRadiusM } from '@/types/domain';

const formatRadius = (radiusM: number): string =>
  radiusM >= 1000 ? `${radiusM / 1000}km` : `${radiusM}m`;

type RadiusSelectorProps = {
  value: SearchRadiusM;
  onChange: (radiusM: SearchRadiusM) => void;
};

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div role="radiogroup" aria-label="検索半径" className="flex items-center gap-2">
      <span className="text-sm text-muted">半径</span>
      {SEARCH_RADII_M.map((radiusM) => {
        const isSelected = radiusM === value;
        return (
          <button
            key={radiusM}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(radiusM)}
            className={`min-h-11 min-w-16 rounded-full border px-3 text-sm font-medium ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-foreground active:bg-surface-muted'
            }`}
          >
            {formatRadius(radiusM)}
          </button>
        );
      })}
    </div>
  );
}
