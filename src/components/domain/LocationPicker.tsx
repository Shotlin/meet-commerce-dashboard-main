import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
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
  /** Show the "Use my current location" button (default true). */
  showCurrentLocation?: boolean;
}

/** Re-centres the map whenever the pin moves from outside a click/drag
 *  (current-location button, saved shop loading in) — MapContainer's own
 *  `center` prop is only read once at mount. */
const Recenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    const current = map.getCenter();
    if (Math.abs(current.lat - position[0]) > 1e-6 || Math.abs(current.lng - position[1]) > 1e-6) {
      map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]]);
  return null;
};

function describeGeoError(err: GeolocationPositionError | Error): string {
  const code = (err as GeolocationPositionError).code;
  if (code === 1) return 'Location permission denied. Allow location access for this site in your browser settings and try again.';
  if (code === 2) return 'Your device could not determine its location. Check that location services are on.';
  if (code === 3) return 'Timed out while getting your location. Please try again.';
  return err.message || 'Could not get your current location.';
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
  showCurrentLocation = true,
}) => {
  const position = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);

  const useMyLocation = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('This browser does not support location access.');
      return;
    }
    if (!window.isSecureContext) {
      setGeoError('Location access needs a secure (https) connection.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setAccuracyM(Math.round(pos.coords.accuracy));
        onChange(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setGeoError(describeGeoError(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div>
    <div className={`relative w-full ${heightClassName} rounded-[10px] overflow-hidden border border-border`}>
      {showCurrentLocation && (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-border shadow text-[11px] font-bold text-ink hover:bg-muted disabled:opacity-60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
      )}
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
          <Circle center={position} radius={radiusKm * 1000} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.08 }} />
        )}
        <ClickHandler onChange={onChange} />
        <Recenter position={position} />
      </MapContainer>
    </div>
    {geoError && <p className="text-[11px] text-status-danger mt-1">{geoError}</p>}
    {!geoError && accuracyM != null && (
      <p className="text-[10px] text-status-neutral mt-1">Pin set to your current location (accuracy ±{accuracyM} m). Drag the pin to fine-tune.</p>
    )}
    </div>
  );
};
