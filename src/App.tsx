import { Suspense, useCallback, useMemo, useState } from 'react';
import { BottomSheet, type SheetState } from '@/components/BottomSheet';
import { FavoriteList } from '@/components/FavoriteList';
import { LocateButton } from '@/components/LocateButton';
import { MESSAGES, geolocationErrorMessage } from '@/components/messages';
import { ParkingDetail } from '@/components/ParkingDetail';
import { ParkingList } from '@/components/ParkingList';
import { SearchBar } from '@/components/SearchBar';
import { CloseIcon } from '@/components/icons';
import type { AppConfig } from '@/config';
import { useFavorites } from '@/hooks/useFavorites';
import { GeolocationError, useGeolocation } from '@/hooks/useGeolocation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useParkingSearch } from '@/hooks/useParkingSearch';
import { useSettings } from '@/hooks/useSettings';
import { MapView } from '@/providers';
import type { MapMarker } from '@/providers/types';
import type { Favorite, GeocodeResult, LatLng, SearchRadiusM } from '@/types/domain';
import { getParkingName } from '@/utils/parkingDisplay';

type SheetContent = 'none' | 'list' | 'detail' | 'favorites';

/** 地図に表示したい位置。値が変わったときだけ地図が移動する */
type MapTarget = { center: LatLng; zoom: number };

/** 現在地・地名・お気に入りから移動するときの最小ズーム */
const FOCUS_ZOOM = 16;

type AppProps = {
  config: Pick<AppConfig, 'defaultCenter' | 'defaultZoom'>;
};

export function App({ config }: AppProps) {
  const { settings, updateSettings } = useSettings({
    radiusM: 500,
    lastCenter: config.defaultCenter,
    lastZoom: config.defaultZoom,
  });
  const search = useParkingSearch();
  const favorites = useFavorites();
  const { locate } = useGeolocation();
  const isOnline = useOnlineStatus();

  const [mapTarget, setMapTarget] = useState<MapTarget>(() => ({
    center: settings.lastCenter,
    zoom: settings.lastZoom,
  }));
  const [sheetContent, setSheetContent] = useState<SheetContent>('none');
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');
  const [sheetHeightPx, setSheetHeightPx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<LatLng | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const { search: runSearch, searchCenter } = search;

  const startSearch = useCallback(
    (center: LatLng, radiusM: SearchRadiusM = settings.radiusM) => {
      setSelectedId(undefined);
      setSheetContent('list');
      setSheetState((current) => (current === 'collapsed' ? 'half' : current));
      void runSearch(center, radiusM);
    },
    [runSearch, settings.radiusM],
  );

  const focusOn = useCallback(
    (center: LatLng) => setMapTarget({ center, zoom: Math.max(settings.lastZoom, FOCUS_ZOOM) }),
    [settings.lastZoom],
  );

  const handleViewChange = useCallback(
    (center: LatLng, zoom: number) => updateSettings({ lastCenter: center, lastZoom: zoom }),
    [updateSettings],
  );

  const handleRadiusChange = (radiusM: SearchRadiusM) => {
    updateSettings({ radiusM });
    if (searchCenter !== undefined) {
      startSearch(searchCenter, radiusM);
    }
  };

  const handleLocate = async () => {
    setIsLocating(true);
    setNotice(undefined);
    try {
      const location = await locate();
      setUserLocation(location);
      focusOn(location);
      startSearch(location);
    } catch (error) {
      setNotice(
        error instanceof GeolocationError
          ? geolocationErrorMessage(error.kind)
          : MESSAGES.geolocationFailed,
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleGeocodeSelect = (candidate: GeocodeResult) => {
    focusOn(candidate.location);
    startSearch(candidate.location);
  };

  const handleSelectParking = useCallback((id: string) => {
    setSelectedId(id);
    setSheetContent('detail');
    setSheetState((current) => (current === 'collapsed' ? 'half' : current));
  }, []);

  const handleSelectFavorite = (favorite: Favorite) => {
    focusOn(favorite.location);
    startSearch(favorite.location);
    // 検索結果の中で、選んだお気に入りを強調表示する
    setSelectedId(favorite.parkingId);
  };

  const handleOpenFavorites = () => {
    setSheetContent('favorites');
    setSheetState((current) => (current === 'collapsed' ? 'half' : current));
  };

  const markers = useMemo<MapMarker[]>(
    () =>
      search.results.map((parking) => ({
        id: parking.id,
        location: parking.location,
        label: getParkingName(parking),
      })),
    [search.results],
  );

  const selectedParking = search.results.find((parking) => parking.id === selectedId);
  const selectedFavorite =
    selectedParking !== undefined ? favorites.findFavorite(selectedParking.id) : undefined;

  const sheetHeader = (() => {
    if (sheetContent === 'none') {
      return <p className="text-sm text-muted">{MESSAGES.hint}</p>;
    }
    if (search.status === 'loading') {
      return <p className="text-sm text-muted">{MESSAGES.searching}</p>;
    }
    if (search.status === 'success') {
      return (
        <p role="status" className="text-sm font-medium">
          {MESSAGES.resultCount(search.results.length)}
        </p>
      );
    }
    return <p className="text-sm text-muted">{MESSAGES.hint}</p>;
  })();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-surface-muted">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="h-full w-full bg-surface-muted" aria-busy="true" />}>
          <MapView
            center={mapTarget.center}
            zoom={mapTarget.zoom}
            bottomInsetPx={sheetHeightPx}
            searchCenter={searchCenter}
            searchRadiusM={search.searchRadiusM}
            markers={markers}
            selectedId={selectedId}
            userLocation={userLocation}
            onMapClick={startSearch}
            onMarkerClick={handleSelectParking}
            onViewChange={handleViewChange}
          />
        </Suspense>
      </div>

      <header className="absolute inset-x-0 top-0 z-1100 flex flex-col gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <SearchBar onSelect={handleGeocodeSelect} onOpenFavorites={handleOpenFavorites} />
        {!isOnline && (
          <p
            role="status"
            className="rounded-full bg-foreground px-4 py-2 text-center text-sm text-surface"
          >
            {MESSAGES.offline}
          </p>
        )}
        {notice !== undefined && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-2xl bg-surface py-1 pl-4 text-sm text-danger shadow-md"
          >
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice(undefined)}
              aria-label="閉じる"
              className="flex size-11 shrink-0 items-center justify-center text-muted"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
        )}
      </header>

      <div
        className="absolute right-3 z-1100 transition-[bottom] duration-200"
        style={{ bottom: sheetHeightPx + 12 }}
      >
        <LocateButton isLocating={isLocating} onClick={() => void handleLocate()} />
      </div>

      <BottomSheet
        state={sheetState}
        onStateChange={setSheetState}
        onHeightChange={setSheetHeightPx}
        header={sheetHeader}
      >
        {sheetContent === 'list' && (
          <ParkingList
            status={search.status}
            results={search.results}
            errorKind={search.errorKind}
            radiusM={settings.radiusM}
            selectedId={selectedId}
            isFavorite={favorites.isFavorite}
            onSelect={handleSelectParking}
            onRadiusChange={handleRadiusChange}
            onRetry={search.retry}
          />
        )}
        {sheetContent === 'detail' && selectedParking !== undefined && (
          <ParkingDetail
            parking={selectedParking}
            favorite={selectedFavorite}
            onBack={() => setSheetContent('list')}
            onToggleFavorite={() => favorites.toggle(selectedParking)}
            onMemoSave={(memo) => favorites.updateMemo(selectedParking.id, memo)}
          />
        )}
        {sheetContent === 'favorites' && (
          <FavoriteList
            favorites={favorites.favorites}
            onSelect={handleSelectFavorite}
            onBack={() => setSheetContent(searchCenter !== undefined ? 'list' : 'none')}
          />
        )}
      </BottomSheet>
    </div>
  );
}
