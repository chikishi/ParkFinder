import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from '@/contexts/ServicesContext';
import { ProviderError, isAbortedError, type ProviderErrorKind } from '@/providers/types';
import type { GeocodeResult } from '@/types/domain';
import { normalizeQuery } from '@/utils/validation';

export type GeocodingStatus = 'idle' | 'loading' | 'success' | 'error';

type GeocodingState = {
  status: GeocodingStatus;
  candidates: GeocodeResult[];
  errorKind?: ProviderErrorKind;
};

const INITIAL_STATE: GeocodingState = { status: 'idle', candidates: [] };

export function useGeocoding() {
  const { geocodingProvider, geocodingThrottle } = useServices();
  const [state, setState] = useState<GeocodingState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => controllerRef.current?.abort(), []);

  /** 検索ボタンを押したときだけ呼ぶ（Nominatim は入力中の自動補完での利用が禁止されている） */
  const search = useCallback(
    async (text: string) => {
      const query = normalizeQuery(text);
      if (query === undefined) {
        return;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ status: 'loading', candidates: [] });

      try {
        const candidates = await geocodingThrottle.run(
          () => geocodingProvider.search(query, controller.signal),
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setState({ status: 'success', candidates });
        }
      } catch (error) {
        if (isAbortedError(error) || controller.signal.aborted) {
          return;
        }
        const errorKind = error instanceof ProviderError ? error.kind : 'network';
        setState({ status: 'error', candidates: [], errorKind });
      }
    },
    [geocodingProvider, geocodingThrottle],
  );

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, search, clear };
}
