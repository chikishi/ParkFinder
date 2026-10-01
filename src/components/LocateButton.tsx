import { LocateIcon } from '@/components/icons';

type LocateButtonProps = {
  isLocating: boolean;
  onClick: () => void;
};

export function LocateButton({ isLocating, onClick }: LocateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocating}
      aria-label="現在地の周辺を検索"
      aria-busy={isLocating}
      className="flex size-14 items-center justify-center rounded-full bg-surface text-primary shadow-lg active:bg-surface-muted disabled:opacity-60"
    >
      <LocateIcon className={isLocating ? 'animate-pulse' : undefined} />
    </button>
  );
}
