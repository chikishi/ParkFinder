import { createContext, useContext, type ReactNode } from 'react';
import type { AppConfig } from '@/config';
import { createGeocodingProvider, createParkingProvider } from '@/providers';
import type { GeocodingProvider } from '@/providers/types';
import { ParkingSearchService } from '@/services/parkingSearchService';
import { RequestThrottle } from '@/services/requestThrottle';
import { SearchCache } from '@/services/searchCache';

/** フックが使うサービスとプロバイダ。テストではモックに差し替える */
export type Services = {
  parkingSearchService: ParkingSearchService;
  geocodingProvider: GeocodingProvider;
  /** Nominatim の利用ポリシー（1 秒に 1 回まで）を守るための間隔制御 */
  geocodingThrottle: RequestThrottle;
};

/** アプリ起動時に 1 度だけ呼び、サービスとプロバイダを作る */
export function createServices(config: AppConfig): Services {
  return {
    parkingSearchService: new ParkingSearchService({
      provider: createParkingProvider(config),
      cache: new SearchCache(),
      throttle: new RequestThrottle(),
    }),
    geocodingProvider: createGeocodingProvider(config),
    geocodingThrottle: new RequestThrottle(),
  };
}

const ServicesContext = createContext<Services | undefined>(undefined);

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext value={services}>{children}</ServicesContext>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (services === undefined) {
    throw new Error('ServicesProvider の内側で使ってください');
  }
  return services;
}
