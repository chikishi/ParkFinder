import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet, type SheetState } from '@/components/BottomSheet';

function renderSheet(state: SheetState) {
  const props = { state, onStateChange: vi.fn(), onHeightChange: vi.fn() };
  render(
    <BottomSheet {...props} header={<p>見出し</p>}>
      <button type="button">中身のボタン</button>
    </BottomSheet>,
  );
  return props;
}

describe('BottomSheet', () => {
  it.each([
    ['collapsed', 'half'],
    ['half', 'full'],
    ['full', 'collapsed'],
  ] as const)('%s の状態でつまみを押すと %s になる', async (state, next) => {
    const props = renderSheet(state);

    await userEvent.click(screen.getByRole('button', { name: 'パネルの高さを切り替える' }));

    expect(props.onStateChange).toHaveBeenCalledWith(next);
  });

  it('状態に応じた高さが通知される', () => {
    const collapsed = renderSheet('collapsed');

    expect(collapsed.onHeightChange).toHaveBeenLastCalledWith(76);
  });

  it('半分の状態では、画面の高さの 45% が通知される', () => {
    const props = renderSheet('half');

    expect(props.onHeightChange).toHaveBeenLastCalledWith(Math.round(window.innerHeight * 0.45));
  });

  it('折りたたみ中は、中身を操作できない', () => {
    renderSheet('collapsed');

    expect(screen.getByText('見出し')).toBeVisible();
    expect(screen.getByRole('button', { name: '中身のボタン' }).closest('[inert]')).not.toBeNull();
  });

  it('開いているときは、中身を操作できる', () => {
    renderSheet('half');

    expect(screen.getByRole('button', { name: '中身のボタン' }).closest('[inert]')).toBeNull();
  });
});
