import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useParkingSearch } from '@/hooks/useParkingSearch';
import { ProviderError, type ParkingProvider } from '@/providers/types';
import type { LatLng, ParkingLot } from '@/types/domain';
import { createMockServices, renderHookWithServices } from '../../helpers/renderWithServices';

const CENTER = { lat: 34.393885, lng: 131.401059 };
const OTHER_CENTER = { lat: 34.41, lng: 131.42 };

const PARKING: ParkingLot = {
  id: 'osm:node/1',
  source: 'osm',
  location: { lat: 34.394, lng: 131.401 },
  parkingType: 'surface',
  fee: 'yes',
};

/** 呼び出しごとに、外から解決・失敗させられる Promise を返すプロバイダ */
function createControlledProvider() {
  const calls: {
    center: LatLng;
    signal?: AbortSignal;
    resolve: (value: ParkingLot[]) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const provider: ParkingProvider = {
    searchNearby: (center, _radiusM, signal) =>
      new Promise((resolve, reject) => {
        calls.push({ center, signal, resolve, reject });
      }),
  };
  return { provider, calls };
}

describe('useParkingSearch', () => {
  it('初期状態は idle で、結果は空', () => {
    const { services } = createMockServices();

    const { result } = renderHookWithServices(() => useParkingSearch(), services);

    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
    expect(result.current.searchCenter).toBeUndefined();
  });

  it('検索すると loading を経て success になり、結果と検索条件が設定される', async () => {
    const { provider, calls } = createControlledProvider();
    const { services } = createMockServices({ parkingProvider: provider });
    const { result } = renderHookWithServices(() => useParkingSearch(), services);

    act(() => {
      void result.current.search(CENTER, 500);
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.searchCenter).toEqual(CENTER);
    expect(result.current.searchRadiusM).toBe(500);

    await waitFor(() => expect(calls).toHaveLength(1));
    await act(async () => calls[0]?.resolve([PARKING]));

    expect(result.current.status).toBe('success');
    expect(result.current.results.map((parking) => parking.id)).toEqual(['osm:node/1']);
  });

  it('失敗すると error になり、失敗の種類が設定される', async () => {
    const { services } = createMockServices({
      parkingProvider: {
        searchNearby: vi.fn().mockRejectedValue(new ProviderError('rate-limit', '混雑')),
      },
    });
    const { result } = renderHookWithServices(() => useParkingSearch(), services);

    await act(() => result.current.search(CENTER, 500));

    expect(result.current.status).toBe('error');
    expect(result.current.errorKind).toBe('rate-limit');
    expect(result.current.results).toEqual([]);
  });

  it('ProviderError 以外のエラーは network として扱われる', async () => {
    const { services } = createMockServices({
      parkingProvider: { searchNearby: vi.fn().mockRejectedValue(new TypeError('x')) },
    });
    const { result } = renderHookWithServices(() => useParkingSearch(), services);

    await act(() => result.current.search(CENTER, 500));

    expect(result.current.errorKind).toBe('network');
  });

  it('新しい検索を始めると前の検索が中断され、前の結果は反映されない', async () => {
    const { provider, calls } = createControlledProvider();
    const { services } = createMockServices({ parkingProvider: provider });
    const { result } = renderHookWithServices(() => useParkingSearch(), services);

    act(() => {
      void result.current.search(CENTER, 500);
    });
    await waitFor(() => expect(calls).toHaveLength(1));
    act(() => {
      void result.current.search(OTHER_CENTER, 500);
    });
    await waitFor(() => expect(calls).toHaveLength(2));

    expect(calls[0]?.signal?.aborted).toBe(true);
    await act(async () => calls[0]?.resolve([PARKING]));
    expect(result.current.status).toBe('loading');

    await act(async () => calls[1]?.resolve([]));
    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([]);
    expect(result.current.searchCenter).toEqual(OTHER_CENTER);
  });

  it('retry で直前と同じ条件の検索がやり直される', async () => {
    const searchNearby = vi
      .fn()
      .mockRejectedValueOnce(new ProviderError('timeout', 'タイムアウト'))
      .mockResolvedValueOnce([PARKING]);
    const { services } = createMockServices({ parkingProvider: { searchNearby } });
    const { result } = renderHookWithServices(() => useParkingSearch(), services);
    await act(() => result.current.search(CENTER, 1000));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(searchNearby).toHaveBeenLastCalledWith(CENTER, 1000, expect.any(AbortSignal));
  });

  it('アンマウントすると実行中の検索が中断される', async () => {
    const { provider, calls } = createControlledProvider();
    const { services } = createMockServices({ parkingProvider: provider });
    const { result, unmount } = renderHookWithServices(() => useParkingSearch(), services);
    act(() => {
      void result.current.search(CENTER, 500);
    });
    await waitFor(() => expect(calls).toHaveLength(1));

    unmount();

    expect(calls[0]?.signal?.aborted).toBe(true);
  });
});
