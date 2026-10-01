type ErrorMessageProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** エラーは alert、単なるお知らせ（0 件など）は status として読み上げる */
  tone?: 'error' | 'info';
};

export function ErrorMessage({
  message,
  actionLabel,
  onAction,
  tone = 'error',
}: ErrorMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex flex-col items-center gap-3 px-4 py-6 text-center"
    >
      <p className={tone === 'error' ? 'text-danger' : 'text-muted'}>{message}</p>
      {actionLabel !== undefined && onAction !== undefined && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-11 rounded-full border border-primary px-5 font-medium text-primary active:bg-surface-muted"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
