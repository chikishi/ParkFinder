import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

const SHEET_STATES = ['collapsed', 'half', 'full'] as const;

export type SheetState = (typeof SHEET_STATES)[number];

/** 折りたたみ時の高さ（つまみと 1 行の見出しが見える高さ） */
const COLLAPSED_HEIGHT_PX = 76;
const HALF_RATIO = 0.45;
const FULL_RATIO = 0.9;
/** これ以上動いたらタップではなくドラッグとみなす */
const DRAG_THRESHOLD_PX = 6;

const NEXT_STATE: Record<SheetState, SheetState> = {
  collapsed: 'half',
  half: 'full',
  full: 'collapsed',
};

function useViewportHeight(): number {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return height;
}

function getHeights(viewportHeight: number): Record<SheetState, number> {
  return {
    collapsed: COLLAPSED_HEIGHT_PX,
    half: Math.max(COLLAPSED_HEIGHT_PX, Math.round(viewportHeight * HALF_RATIO)),
    full: Math.max(COLLAPSED_HEIGHT_PX, Math.round(viewportHeight * FULL_RATIO)),
  };
}

type BottomSheetProps = {
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  /** シートが地図を覆っている高さ（px）が変わったときに呼ばれる */
  onHeightChange: (heightPx: number) => void;
  /** つまみの下に常に表示する見出し */
  header: ReactNode;
  children: ReactNode;
};

type DragState = { startY: number; startHeight: number; isDragging: boolean };

export function BottomSheet({
  state,
  onStateChange,
  onHeightChange,
  header,
  children,
}: BottomSheetProps) {
  const viewportHeight = useViewportHeight();
  const heights = getHeights(viewportHeight);
  const [dragHeight, setDragHeight] = useState<number | undefined>(undefined);
  const dragRef = useRef<DragState | undefined>(undefined);
  const suppressClickRef = useRef(false);

  const targetHeight = heights[state];
  const currentHeight = dragHeight ?? targetHeight;

  useEffect(() => {
    onHeightChange(targetHeight);
  }, [targetHeight, onHeightChange]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 指がつまみの外に出てもドラッグを追えるようにする（未対応の環境では省略する）
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startY: event.clientY, startHeight: targetHeight, isDragging: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag === undefined) {
      return;
    }
    const delta = drag.startY - event.clientY;
    if (!drag.isDragging && Math.abs(delta) < DRAG_THRESHOLD_PX) {
      return;
    }
    drag.isDragging = true;
    setDragHeight(Math.min(heights.full, Math.max(heights.collapsed, drag.startHeight + delta)));
  };

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    dragRef.current = undefined;
    if (drag === undefined || !drag.isDragging || dragHeight === undefined) {
      return;
    }
    // ドラッグ後に発生する click でさらに段階が変わらないようにする
    suppressClickRef.current = true;
    const nearest = SHEET_STATES.reduce<SheetState>(
      (best, candidate) =>
        Math.abs(heights[candidate] - dragHeight) < Math.abs(heights[best] - dragHeight)
          ? candidate
          : best,
      'collapsed',
    );
    setDragHeight(undefined);
    onStateChange(nearest);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onStateChange(NEXT_STATE[state]);
  };

  return (
    <section
      aria-label="検索結果"
      className="fixed inset-x-0 bottom-0 z-1100 flex flex-col rounded-t-2xl bg-surface shadow-2xl"
      style={{
        height: currentHeight,
        transition: dragHeight === undefined ? 'height 200ms ease-out' : 'none',
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="shrink-0 touch-none select-none"
      >
        <button
          type="button"
          onClick={handleClick}
          aria-label="パネルの高さを切り替える"
          aria-expanded={state !== 'collapsed'}
          className="flex h-7 w-full items-center justify-center"
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </button>
        <div className="px-4 pb-2">{header}</div>
      </div>
      <div
        inert={state === 'collapsed' && dragHeight === undefined}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
      >
        {children}
      </div>
    </section>
  );
}
