import { useState, type FormEvent } from 'react';
import { CloseIcon, SearchIcon, StarIcon } from '@/components/icons';
import { MESSAGES } from '@/components/messages';
import { useGeocoding } from '@/hooks/useGeocoding';
import type { GeocodeResult } from '@/types/domain';
import { MAX_QUERY_LENGTH } from '@/utils/validation';

type SearchBarProps = {
  onSelect: (candidate: GeocodeResult) => void;
  onOpenFavorites: () => void;
};

export function SearchBar({ onSelect, onOpenFavorites }: SearchBarProps) {
  const [text, setText] = useState('');
  const { status, candidates, search, clear } = useGeocoding();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 入力中の自動補完は行わず、検索ボタン（Enter）を押したときだけ問い合わせる
    void search(text);
  };

  const handleSelect = (candidate: GeocodeResult) => {
    clear();
    onSelect(candidate);
  };

  const handleClear = () => {
    setText('');
    clear();
  };

  const isPanelOpen = status !== 'idle';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <form
          role="search"
          onSubmit={handleSubmit}
          className="flex min-h-12 flex-1 items-center rounded-full bg-surface pl-4 shadow-md"
        >
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_QUERY_LENGTH}
            enterKeyHint="search"
            placeholder="地名・住所で検索"
            aria-label="地名・住所"
            className="min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {text !== '' && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="入力を消去"
              className="flex size-11 shrink-0 items-center justify-center text-muted"
            >
              <CloseIcon className="size-5" />
            </button>
          )}
          <button
            type="submit"
            aria-label="検索"
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-primary"
          >
            <SearchIcon />
          </button>
        </form>
        <button
          type="button"
          onClick={onOpenFavorites}
          aria-label="お気に入り一覧"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-favorite shadow-md"
        >
          <StarIcon filled />
        </button>
      </div>

      {isPanelOpen && (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-md">
          {status === 'loading' && (
            <p role="status" className="px-4 py-3 text-sm text-muted">
              {MESSAGES.geocodeSearching}
            </p>
          )}
          {status === 'error' && (
            <p role="alert" className="px-4 py-3 text-sm text-danger">
              {MESSAGES.geocodeFailed}
            </p>
          )}
          {status === 'success' && candidates.length === 0 && (
            <p role="status" className="px-4 py-3 text-sm text-muted">
              {MESSAGES.geocodeNoResults}
            </p>
          )}
          {status === 'success' && candidates.length > 0 && (
            <ul aria-label="検索候補" className="max-h-72 divide-y divide-border overflow-y-auto">
              {candidates.map((candidate) => (
                <li key={`${candidate.location.lat},${candidate.location.lng},${candidate.label}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(candidate)}
                    className="min-h-11 w-full px-4 py-2 text-left text-sm active:bg-surface-muted"
                  >
                    {candidate.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
