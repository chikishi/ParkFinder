import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGeocoding } from '@/hooks/useGeocoding';
import { ProviderError } from '@/providers/types';
import { createMockServices, renderHookWithServices } from '../../helpers/renderWithServices';

const CANDIDATE = { label: '萩駅, 萩市, 山口県, 日本', location: { lat: 34.3939, lng: 131.4011 } };

describe('useGeocoding', () => {
  it('検索すると、前後の空白を除いた文字列で問い合わせ、候補が設定される', async () => {
    const search = vi.fn(async () => [CANDIDATE]);
    const { services } = createMockServices({ geocodingProvider: { search } });
    const { result } = renderHookWithServices(() => useGeocoding(), services);

    await act(() => result.current.search('  萩駅  '));

    expect(search).toHaveBeenCalledWith('萩駅', expect.any(AbortSignal));
    expect(result.current.status).toBe('success');
    expect(result.current.candidates).toEqual([CANDIDATE]);
  });

  it('空白だけの入力では問い合わせない', async () => {
    const search = vi.fn(async () => []);
    const { services } = createMockServices({ geocodingProvider: { search } });
    const { result } = renderHookWithServices(() => useGeocoding(), services);

    await act(() => result.current.search('   '));

    expect(search).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('失敗すると error になり、失敗の種類が設定される', async () => {
    const { services } = createMockServices({
      geocodingProvider: { search: vi.fn().mockRejectedValue(new ProviderError('network', 'x')) },
    });
    const { result } = renderHookWithServices(() => useGeocoding(), services);

    await act(() => result.current.search('萩駅'));

    expect(result.current.status).toBe('error');
    expect(result.current.errorKind).toBe('network');
  });

  it('clear で初期状態に戻る', async () => {
    const { services } = createMockServices({
      geocodingProvider: { search: vi.fn(async () => [CANDIDATE]) },
    });
    const { result } = renderHookWithServices(() => useGeocoding(), services);
    await act(() => result.current.search('萩駅'));

    act(() => result.current.clear());

    expect(result.current.status).toBe('idle');
    expect(result.current.candidates).toEqual([]);
  });
});
