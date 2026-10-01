import { BackIcon, StarIcon } from '@/components/icons';
import { MESSAGES } from '@/components/messages';
import type { Favorite } from '@/types/domain';

type FavoriteListProps = {
  favorites: Favorite[];
  onSelect: (favorite: Favorite) => void;
  onBack: () => void;
};

export function FavoriteList({ favorites, onSelect, onBack }: FavoriteListProps) {
  return (
    <section aria-labelledby="favorite-list-title">
      <div className="flex items-center gap-1 px-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="-ml-3 flex size-11 shrink-0 items-center justify-center rounded-full active:bg-surface-muted"
        >
          <BackIcon />
        </button>
        <h2 id="favorite-list-title" className="text-lg font-bold">
          お気に入り
        </h2>
      </div>

      {favorites.length === 0 ? (
        <p className="px-4 py-6 text-center text-muted">{MESSAGES.noFavorites}</p>
      ) : (
        <ul aria-label="お気に入り一覧" className="divide-y divide-border">
          {favorites.map((favorite) => (
            <li key={favorite.parkingId}>
              <button
                type="button"
                onClick={() => onSelect(favorite)}
                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-muted"
              >
                <StarIcon filled className="shrink-0 text-favorite" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{favorite.name}</span>
                  {favorite.memo !== '' && (
                    <span className="block truncate text-sm text-muted">{favorite.memo}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
