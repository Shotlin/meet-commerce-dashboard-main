import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite bundles leaflet's default marker icon paths incorrectly out of the
// box (they resolve relative to the built JS, not the assets dir) — every
// react-leaflet setup needs this fix or markers render as broken images.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  radiusKm?: number;
  onChange: (lat: number, lng: number) => void;
  heightClassName?: string;
}

const ClickHandler: React.FC<{ onChange: (lat: number, lng: number) => void }> = ({ onChange }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * Draggable-pin + click-to-place map for setting a store's precise lat/lng,
 * with a live circle preview of its delivery radius. Leaflet + OpenStreetMap
 * tiles — no API key, no billing, matches the "no local Docker / keep prod
 * setup simple" constraint.
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  radiusKm,
  onChange,
  heightClassName = 'h-64',
}) => {
  const position = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  return (
    <div className={`w-full ${heightClassName} rounded-[10px] overflow-hidden border border-border`}>
      <MapContainer center={position} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          icon={defaultIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker;
              const { lat: newLat, lng: newLng } = marker.getLatLng();
              onChange(newLat, newLng);
            },
          }}
        />
        {radiusKm != null && radiusKm > 0 && (
          <Circle center={position} radius={radiusKm * 1000} pathOptions={{ color: '#E31E64', fillColor: '#E31E64', fillOpacity: 0.08 }} />
        )}
        <ClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
};
