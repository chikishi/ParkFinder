import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LocateButton } from '@/components/LocateButton';

describe('LocateButton', () => {
  it('押すと onClick が呼ばれる', async () => {
    const onClick = vi.fn();
    render(<LocateButton isLocating={false} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: '現在地の周辺を検索' }));

    expect(onClick).toHaveBeenCalled();
  });

  it('取得中は押せない', () => {
    render(<LocateButton isLocating onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '現在地の周辺を検索' })).toBeDisabled();
  });
});
