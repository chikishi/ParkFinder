import { useCallback } from 'react';
import type { LatLng } from '@/types/domain';

export type GeolocationErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeolocationError extends Error {
  readonly kind: GeolocationErrorKind;

  constructor(kind: GeolocationErrorKind) {
    super(`現在地を取得できませんでした（${kind}）`);
    this.name = 'GeolocationError';
    this.kind = kind;
  }
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  // 到着直前の利用を想定し、1 分以内に取得した位置なら使い回して素早く応答する
  maximumAge: 60_000,
};

function toErrorKind(error: GeolocationPositionError): GeolocationErrorKind {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'denied';
    case error.TIMEOUT:
      return 'timeout';
    default:
      return 'unavailable';
  }
}

export function useGeolocation() {
  const locate = useCallback(
    () =>
      new Promise<LatLng>((resolve, reject) => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          reject(new GeolocationError('unsupported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          (error) => reject(new GeolocationError(toErrorKind(error))),
          OPTIONS,
        );
      }),
    [],
  );

  return { locate };
}
