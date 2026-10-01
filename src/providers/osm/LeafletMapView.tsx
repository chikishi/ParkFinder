import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import {
  AttributionControl,
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapViewProps } from '@/providers/types';
import type { LatLng } from '@/types/domain';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const CENTER_ICON = L.divIcon({
  className: 'pf-center-icon',
  html:
    '<svg viewBox="0 0 24 32" width="28" height="36" aria-hidden="true">' +
    '<path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z"/>' +
    '<circle cx="12" cy="11.5" r="4.5"/></svg>',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

/**
 * 地図の中心を、下部のボトムシートで隠れていない領域の中央に合わせるための座標を計算する。
 * 画面の中心より bottomInsetPx / 2 だけ下の位置を地図の中心にすると、target は見える領域の中央に来る。
 */
function offsetCenter(map: L.Map, target: LatLng, zoom: number, bottomInsetPx: number): L.LatLng {
  const point = map.project([target.lat, target.lng], zoom).add([0, bottomInsetPx / 2]);
  return map.unproject(point, zoom);
}

type ControllerProps = Pick<
  MapViewProps,
  'center' | 'zoom' | 'bottomInsetPx' | 'onMapClick' | 'onViewChange'
>;

/** props と地図の状態を同期し、地図の操作を通知する */
function MapController({ center, zoom, bottomInsetPx, onMapClick, onViewChange }: ControllerProps) {
  const map = useMap();
  const isFirstRef = useRef(true);
  // シートの高さが変わっただけでは地図を動かさないよう、最新の値を ref で参照する
  const bottomInsetRef = useRef(bottomInsetPx);
  useEffect(() => {
    bottomInsetRef.current = bottomInsetPx;
  }, [bottomInsetPx]);

  // center・zoom は「表示したい位置」として扱い、変わったときだけ移動する。
  // 利用者が地図を動かした結果は onViewChange で通知するだけで、props には戻さない
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    map.flyTo(offsetCenter(map, center, zoom, bottomInsetRef.current), zoom, { duration: 0.5 });
  }, [map, center, zoom]);

  useMapEvents({
    click: (event) => onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng }),
    moveend: () => {
      const { lat, lng } = map.getCenter();
      onViewChange({ lat, lng }, map.getZoom());
    },
  });

  return null;
}

export function LeafletMapView({
  center,
  zoom,
  bottomInsetPx,
  searchCenter,
  searchRadiusM,
  markers,
  selectedId,
  userLocation,
  onMapClick,
  onMarkerClick,
  onViewChange,
}: MapViewProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      aria-label="地図"
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
      <AttributionControl position="topright" prefix={false} />
      <MapController
        center={center}
        zoom={zoom}
        bottomInsetPx={bottomInsetPx}
        onMapClick={onMapClick}
        onViewChange={onViewChange}
      />

      {searchCenter !== undefined && searchRadiusM !== undefined && (
        <Circle
          center={[searchCenter.lat, searchCenter.lng]}
          radius={searchRadiusM}
          interactive={false}
          // className は作成時にしか反映されない（pathOptions で渡すと setStyle 経由になり無視される）
          className="pf-search-radius"
        />
      )}

      {markers.map((marker) => {
        const isSelected = marker.id === selectedId;
        return (
          <CircleMarker
            key={`${marker.id}:${isSelected ? 'selected' : 'normal'}`}
            center={[marker.location.lat, marker.location.lng]}
            radius={isSelected ? 11 : 8}
            // マーカーのタップを地図のタップ（地点指定検索）として扱わない
            bubblingMouseEvents={false}
            className={isSelected ? 'pf-parking-marker is-selected' : 'pf-parking-marker'}
            eventHandlers={{ click: () => onMarkerClick(marker.id) }}
          />
        );
      })}

      {searchCenter !== undefined && (
        <Marker
          position={[searchCenter.lat, searchCenter.lng]}
          icon={CENTER_ICON}
          interactive={false}
          keyboard={false}
        />
      )}

      {userLocation !== undefined && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={7}
          interactive={false}
          className="pf-user-location"
        />
      )}
    </MapContainer>
  );
}
