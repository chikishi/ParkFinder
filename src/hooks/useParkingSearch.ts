import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from '@/contexts/ServicesContext';
import { ProviderError, isAbortedError, type ProviderErrorKind } from '@/providers/types';
import type { LatLng, ParkingSearchResult } from '@/types/domain';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

type SearchQuery = { center: LatLng; radiusM: number };

type ParkingSearchState = {
  status: SearchStatus;
  results: ParkingSearchResult[];
  /** 失敗の種類。画面の文言への変換はコンポーネントで行う */
  errorKind?: ProviderErrorKind;
  query?: SearchQuery;
};

export function useParkingSearch() {
  const { parkingSearchService } = useServices();
  const [state, setState] = useState<ParkingSearchState>({ status: 'idle', results: [] });
  const controllerRef = useRef<AbortController | undefined>(undefined);

  // 画面を離れたら実行中の検索を中断する
  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(
    async (center: LatLng, radiusM: number) => {
      // 新しい検索を始めるときは、前の検索を中断する（結果の取り違えと無駄な通信を防ぐ）
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const query = { center, radiusM };
      setState((previous) => ({ status: 'loading', results: previous.results, query }));

      try {
        const results = await parkingSearchService.search(center, radiusM, controller.signal);
        if (!controller.signal.aborted) {
          setState({ status: 'success', results, query });
        }
      } catch (error) {
        if (isAbortedError(error) || controller.signal.aborted) {
          return;
        }
        const errorKind = error instanceof ProviderError ? error.kind : 'network';
        setState({ status: 'error', results: [], errorKind, query });
      }
    },
    [parkingSearchService],
  );

  const retry = useCallback(() => {
    if (state.query !== undefined) {
      void search(state.query.center, state.query.radiusM);
    }
  }, [search, state.query]);

  return {
    status: state.status,
    results: state.results,
    errorKind: state.errorKind,
    searchCenter: state.query?.center,
    searchRadiusM: state.query?.radiusM,
    search,
    retry,
  };
}
