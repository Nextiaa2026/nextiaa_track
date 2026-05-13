"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FlyToPosition({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.flyTo(position, 11, { duration: 1.2 });
  }, [map, position]);

  return null;
}

type TrackingMapProps = {
  markerPosition: [number, number] | null;
  popupLabel?: string;
};

const DEFAULT_CENTER: [number, number] = [18, 5];
const DEFAULT_ZOOM = 3;
const WORLD_BOUNDS = L.latLngBounds(
  L.latLng(-85, -180),
  L.latLng(85, 180),
);

export function TrackingMap({
  markerPosition,
  popupLabel,
}: TrackingMapProps) {
  const center = markerPosition ?? DEFAULT_CENTER;
  const zoom = markerPosition ? 11 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full min-h-[320px]"
      scrollWheelZoom
      zoomControl
      minZoom={2}
      maxBounds={WORLD_BOUNDS}
      maxBoundsViscosity={1}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap
      />
      <FlyToPosition position={markerPosition} />
      {markerPosition ? (
        <Marker position={markerPosition} icon={markerIcon}>
          {popupLabel ? (
            <Popup>
              <span className="text-sm">{popupLabel}</span>
            </Popup>
          ) : null}
        </Marker>
      ) : null}
    </MapContainer>
  );
}
