import { StarIcon } from '@/components/icons';

type FavoriteToggleProps = {
  isFavorite: boolean;
  onToggle: () => void;
};

export function FavoriteToggle({ isFavorite, onToggle }: FavoriteToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'お気に入りを解除' : 'お気に入りに登録'}
      className="flex size-11 shrink-0 items-center justify-center rounded-full active:bg-surface-muted"
    >
      <StarIcon filled={isFavorite} className={isFavorite ? 'text-favorite' : 'text-muted'} />
    </button>
  );
}
