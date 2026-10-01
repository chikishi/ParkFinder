import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavigateButton } from '@/components/NavigateButton';

describe('NavigateButton', () => {
  it('座標が不正な場合はリンクを表示せず、その旨を表示する', () => {
    render(<NavigateButton destination={{ lat: 200, lng: 0 }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/ナビを開始できません/)).toBeInTheDocument();
  });
});
