import { CarIcon } from '@/components/icons';
import { MESSAGES } from '@/components/messages';
import type { LatLng } from '@/types/domain';
import { buildNavigationUrl } from '@/utils/navigation';

type NavigateButtonProps = {
  destination: LatLng;
};

export function NavigateButton({ destination }: NavigateButtonProps) {
  const url = buildNavigationUrl(destination);

  if (url === undefined) {
    return <p className="text-sm text-danger">{MESSAGES.navigationUnavailable}</p>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground active:opacity-80"
    >
      <CarIcon />
      ナビを開始
    </a>
  );
}
