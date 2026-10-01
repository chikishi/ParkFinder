import { render, renderHook, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { ServicesProvider, type Services } from '@/contexts/ServicesContext';
import type { GeocodingProvider, ParkingProvider } from '@/providers/types';
import { ParkingSearchService } from '@/services/parkingSearchService';
import { RequestThrottle } from '@/services/requestThrottle';
import { SearchCache } from '@/services/searchCache';

type MockOptions = {
  parkingProvider?: ParkingProvider;
  geocodingProvider?: GeocodingProvider;
};

/** テスト用のサービス。間隔制御は無効にし、プロバイダはモックにする */
export function createMockServices(options: MockOptions = {}) {
  const parkingProvider: ParkingProvider = options.parkingProvider ?? {
    searchNearby: vi.fn(async () => []),
  };
  const geocodingProvider: GeocodingProvider = options.geocodingProvider ?? {
    search: vi.fn(async () => []),
  };
  const services: Services = {
    parkingSearchService: new ParkingSearchService({
      provider: parkingProvider,
      cache: new SearchCache(),
      throttle: new RequestThrottle({ minIntervalMs: 0 }),
    }),
    geocodingProvider,
    geocodingThrottle: new RequestThrottle({ minIntervalMs: 0 }),
  };
  return { services, parkingProvider, geocodingProvider };
}

export function createWrapper(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesProvider services={services}>{children}</ServicesProvider>;
  };
}

export function renderHookWithServices<T>(hook: () => T, services: Services) {
  return renderHook(hook, { wrapper: createWrapper(services) });
}

export function renderWithServices(
  ui: ReactElement,
  services: Services,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: createWrapper(services), ...options });
}
