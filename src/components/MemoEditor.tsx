import { useId, useState } from 'react';
import { MESSAGES } from '@/components/messages';
import { MAX_MEMO_LENGTH } from '@/utils/validation';

type MemoEditorProps = {
  initialMemo: string;
  /** 入力欄からフォーカスが外れたときに呼ばれる */
  onSave: (memo: string) => void;
};

/** お気に入りのメモ。駐車場が変わったときは key を変えて作り直す */
export function MemoEditor({ initialMemo, onSave }: MemoEditorProps) {
  const id = useId();
  const [memo, setMemo] = useState(initialMemo);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        メモ
      </label>
      <textarea
        id={id}
        value={memo}
        maxLength={MAX_MEMO_LENGTH}
        rows={3}
        placeholder={MESSAGES.memoPlaceholder}
        onChange={(event) => setMemo(event.target.value)}
        onBlur={() => onSave(memo)}
        className="w-full resize-none rounded-lg border border-border p-2 text-base focus:border-primary focus:outline-none"
      />
      <p className="text-right text-xs text-muted tabular-nums">
        {memo.length} / {MAX_MEMO_LENGTH}
      </p>
    </div>
  );
}
