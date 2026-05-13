"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useActiveShipmentsMap } from "@/hooks/useShipments";
import { getStatusDisplay } from "@/lib/utils/shipment";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function ActiveShipmentsMapLeaflet() {
  const { data, isLoading } = useActiveShipmentsMap();
  const markers = data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        Aucune expédition active avec coordonnées.
      </div>
    );
  }

  const center = [markers[0].latitude, markers[0].longitude] as [number, number];

  return (
    <div className="h-[420px] overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={4} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.shipmentId}
            position={[marker.latitude, marker.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{marker.trackingNumber}</p>
                <p>{marker.itemName}</p>
                <p>Statut: {getStatusDisplay(marker.status)}</p>
                {marker.vesselName ? <p>Navire: {marker.vesselName}</p> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
