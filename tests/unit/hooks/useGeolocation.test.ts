import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeolocationError, useGeolocation } from '@/hooks/useGeolocation';

type ErrorCallback = (error: GeolocationPositionError) => void;

const positionError = (code: number): GeolocationPositionError => ({
  code,
  message: '',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
});

function mockGeolocation(getCurrentPosition: Geolocation['getCurrentPosition']) {
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: { getCurrentPosition },
  });
}

describe('useGeolocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('取得した現在地を緯度・経度で返す', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: 34.39, longitude: 131.4 } } as GeolocationPosition),
    );
    mockGeolocation(getCurrentPosition);
    const { result } = renderHook(() => useGeolocation());

    await expect(result.current.locate()).resolves.toEqual({ lat: 34.39, lng: 131.4 });
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }),
    );
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('エラーコード %i の場合は %s のエラーになる', async (code, kind) => {
    mockGeolocation((_success, error) => (error as ErrorCallback)(positionError(code)));
    const { result } = renderHook(() => useGeolocation());

    const promise = result.current.locate();

    await expect(promise).rejects.toBeInstanceOf(GeolocationError);
    await expect(promise).rejects.toMatchObject({ kind });
  });

  it('位置情報に対応していない場合は unsupported のエラーになる', async () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useGeolocation());

    await expect(result.current.locate()).rejects.toMatchObject({ kind: 'unsupported' });
  });
});
