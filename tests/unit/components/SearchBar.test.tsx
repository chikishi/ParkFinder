import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '@/components/SearchBar';
import { ProviderError } from '@/providers/types';
import { createMockServices, renderWithServices } from '../../helpers/renderWithServices';

const CANDIDATES = [
  { label: '萩駅, 萩市, 山口県, 日本', location: { lat: 34.3939, lng: 131.4011 } },
  { label: '東萩駅, 萩市, 山口県, 日本', location: { lat: 34.4127, lng: 131.4153 } },
];

function renderSearchBar(search = vi.fn(async () => CANDIDATES)) {
  const { services } = createMockServices({ geocodingProvider: { search } });
  const props = { onSelect: vi.fn(), onOpenFavorites: vi.fn() };
  renderWithServices(<SearchBar {...props} />, services);
  return { ...props, search };
}

describe('SearchBar', () => {
  it('入力中は問い合わせず、検索ボタンを押したときだけ問い合わせる', async () => {
    const { search } = renderSearchBar();

    await userEvent.type(screen.getByLabelText('地名・住所'), '萩駅');
    expect(search).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '検索' }));

    expect(search).toHaveBeenCalledWith('萩駅', expect.any(AbortSignal));
  });

  it('Enter キーでも検索できる', async () => {
    const { search } = renderSearchBar();

    await userEvent.type(screen.getByLabelText('地名・住所'), '萩駅{Enter}');

    expect(search).toHaveBeenCalledTimes(1);
  });

  it('候補を選ぶと onSelect が呼ばれ、候補の表示が閉じる', async () => {
    const { onSelect } = renderSearchBar();
    await userEvent.type(screen.getByLabelText('地名・住所'), '萩{Enter}');

    await userEvent.click(
      await screen.findByRole('button', { name: '東萩駅, 萩市, 山口県, 日本' }),
    );

    expect(onSelect).toHaveBeenCalledWith(CANDIDATES[1]);
    expect(screen.queryByRole('list', { name: '検索候補' })).not.toBeInTheDocument();
  });

  it('候補が 0 件の場合は、その旨が表示される', async () => {
    renderSearchBar(vi.fn(async () => []));

    await userEvent.type(screen.getByLabelText('地名・住所'), 'ああああ{Enter}');

    expect(await screen.findByRole('status')).toHaveTextContent(
      '該当する場所が見つかりませんでした',
    );
  });

  it('失敗した場合は、エラーが表示される', async () => {
    renderSearchBar(vi.fn().mockRejectedValue(new ProviderError('network', 'x')));

    await userEvent.type(screen.getByLabelText('地名・住所'), '萩駅{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('場所を検索できませんでした');
  });

  it('消去ボタンで入力と候補が消える', async () => {
    renderSearchBar();
    const input = screen.getByLabelText('地名・住所');
    await userEvent.type(input, '萩{Enter}');
    await screen.findByRole('list', { name: '検索候補' });

    await userEvent.click(screen.getByRole('button', { name: '入力を消去' }));

    expect(input).toHaveValue('');
    expect(screen.queryByRole('list', { name: '検索候補' })).not.toBeInTheDocument();
  });

  it('入力は 100 文字までに制限される', () => {
    renderSearchBar();

    expect(screen.getByLabelText('地名・住所')).toHaveAttribute('maxLength', '100');
  });

  it('お気に入りボタンで onOpenFavorites が呼ばれる', async () => {
    const { onOpenFavorites } = renderSearchBar();

    await userEvent.click(screen.getByRole('button', { name: 'お気に入り一覧' }));

    expect(onOpenFavorites).toHaveBeenCalled();
  });
});
