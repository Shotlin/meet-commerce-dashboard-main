import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// maplibre-gl resolves its worker chunk at runtime as `./maplibre-gl-worker.mjs`
// relative to its own bundle URL (see maplibre-gl/dist/maplibre-gl.mjs#defaultWorkerUrl) —
// a dynamic string Vite's static import analysis can't see, so the file never made it
// into the build output at all (Vercel's SPA rewrite served index.html for it instead,
// silently breaking every map on this page). A `?url` import of just the worker file
// isn't enough on its own either — that worker file itself has its own internal
// `import ... from "./maplibre-gl-shared.mjs"` (a second, ~500KB internal dependency
// chunk maplibre-gl splits its worker/main-thread-shared code into), and Vite's `?url`
// suffix copies a file byte-for-byte as an opaque asset without resolving or copying
// along anything it imports — so that second file 404'd exactly the same way. Fixed by
// copying BOTH files verbatim into public/maplibre-worker/ (Vite serves public/ files
// unhashed, at a fixed path, so the worker's relative sibling import keeps resolving
// correctly, exactly as it does inside node_modules/maplibre-gl/dist/) and pointing
// setWorkerUrl at the fixed path instead of importing anything. If maplibre-gl is ever
// upgraded, re-copy both files from node_modules/maplibre-gl/dist/ (a version mismatch
// between the app's bundled maplibre-gl and these two files can break map rendering).
setWorkerUrl('/maplibre-worker/maplibre-gl-worker.mjs');
import { Users, MapPinned, ShieldCheck, RefreshCw, Bike, MapPin as MapPinIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useShopScope } from '../context/ShopScopeContext';
import { useCoverageMap, useShopLiveRiders, useOlaStyleInfo } from '../hooks/useCoverageMap';
import { useLiveRiderLocations } from '../hooks/useLiveRiderLocations';
import { CoverageCustomer } from '../services/coverageMapService';

/** A dependency-free lat/lng circle, matching the backend's own circlePolygon()
 * (coverage-map/geometry.js) so the drawn radius agrees with what the server
 * used to compute pincode boundary shapes. */
function circleGeoJson(centerLat: number, centerLng: number, radiusKm: number, segments = 64) {
  const KM_PER_DEGREE_LAT = 111;
  const latRad = (centerLat * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const dLat = (radiusKm / KM_PER_DEGREE_LAT) * Math.cos(angle);
    const dLng = (radiusKm / (KM_PER_DEGREE_LAT * Math.max(Math.cos(latRad), 0.01))) * Math.sin(angle);
    coords.push([centerLng + dLng, centerLat + dLat]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}

const radiusFillLayer: LayerProps = {
  id: 'delivery-radius-fill',
  type: 'fill',
  paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.06 },
};
const radiusLineLayer: LayerProps = {
  id: 'delivery-radius-line',
  type: 'line',
  paint: { 'line-color': '#2563EB', 'line-width': 1.5, 'line-dasharray': [2, 2] },
};
const boundaryFillLayer: LayerProps = {
  id: 'pincode-boundary-fill',
  type: 'fill',
  paint: { 'fill-color': '#7C3AED', 'fill-opacity': 0.05 },
};
const boundaryLineLayer: LayerProps = {
  id: 'pincode-boundary-line',
  type: 'line',
  paint: { 'line-color': '#7C3AED', 'line-width': 1, 'line-opacity': 0.4 },
};

export const CoverageMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { shops, activeShopId } = useShopScope();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(activeShopId);
  const shopId = selectedShopId || activeShopId || shops[0]?.id || null;

  const coverageQuery = useCoverageMap(shopId);
  const ridersQuery = useShopLiveRiders(shopId);
  const olaStyleQuery = useOlaStyleInfo();

  const riderIds = useMemo(() => (ridersQuery.data || []).map((r) => r.id), [ridersQuery.data]);
  const { positions: livePositions } = useLiveRiderLocations(riderIds);

  const [selectedCustomer, setSelectedCustomer] = useState<CoverageCustomer | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const coverage = coverageQuery.data;
  const riders = ridersQuery.data || [];
  const selectedRider = riders.find((r) => r.id === selectedRiderId) || null;

  const pincodeBoundariesGeoJson = useMemo(() => {
    if (!coverage) return null;
    return {
      type: 'FeatureCollection' as const,
      features: coverage.boundaries.map((b) => ({
        type: 'Feature' as const,
        properties: { pincode: b.pincode, count: b.count },
        // backend returns [lat, lng] pairs; GeoJSON wants [lng, lat].
        geometry: { type: 'Polygon' as const, coordinates: [b.polygon.map(([lat, lng]) => [lng, lat])] },
      })),
    };
  }, [coverage]);

  const radiusGeoJson = useMemo(() => {
    if (!coverage || coverage.shop.pincodeOnly || !coverage.shop.deliveryRadiusKm) return null;
    return circleGeoJson(coverage.shop.lat, coverage.shop.lng, coverage.shop.deliveryRadiusKm);
  }, [coverage]);

  return (
    <div>
      <PageHeader
        title="Store Coverage Map"
        subtitle="Where a store's real, delivered-to customers actually are — plotted from live address data, plus every rider currently out on a delivery for it."
        badge={<Badge variant="neutral" icon={<MapPinned className="w-3.5 h-3.5" />}>{coverage?.totalCustomers ?? 0} covered</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={shopId || ''}
              onChange={(e) => setSelectedShopId(e.target.value || null)}
              className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${coverageQuery.isFetching ? 'animate-spin' : ''}`} />}
              onClick={() => { coverageQuery.refetch(); ridersQuery.refetch(); }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {!shopId && (
        <Card>
          <p className="text-sm text-status-neutral">Select a shop to see its coverage map.</p>
        </Card>
      )}

      {shopId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card padding="md" className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-info/10 text-status-info">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-status-neutral">Customers covered</p>
                <p className="font-mono-num text-xl font-extrabold text-ink">{coverage?.totalCustomers ?? '—'}</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-status-neutral">Pincodes with customers</p>
                <p className="font-mono-num text-xl font-extrabold text-ink">{coverage?.boundaries.length ?? '—'}</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success/10 text-status-success">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-status-neutral">Serviceable pincodes</p>
                <p className="font-mono-num text-xl font-extrabold text-ink">{coverage?.serviceablePincodes.length ?? '—'}</p>
              </div>
            </Card>
          </div>

          <Card padding="none">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-base font-bold text-ink tracking-tight">{coverage?.shop.name || 'Coverage'}</h3>
                <p className="text-xs text-status-neutral mt-0.5">
                  {riders.length > 0 ? `${riders.length} rider${riders.length === 1 ? '' : 's'} currently out for delivery` : 'No riders currently out for this shop'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-ink-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-info" /> Active order</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-300" /> No active order</span>
                <span className="flex items-center gap-1.5"><Bike className="w-3.5 h-3.5 text-violet-600" /> Rider</span>
              </div>
            </div>

            <div className="relative" style={{ height: 560 }}>
              {coverageQuery.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-status-neutral">Loading coverage data…</div>
              ) : coverageQuery.isError ? (
                <div className="flex h-full items-center justify-center text-sm text-status-danger">
                  {coverageQuery.error instanceof Error ? coverageQuery.error.message : 'Failed to load coverage map'}
                </div>
              ) : olaStyleQuery.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-status-neutral">Loading map…</div>
              ) : !olaStyleQuery.data?.configured || !olaStyleQuery.data.styleUrl ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-6">
                  <MapPinned className="w-8 h-8 text-status-neutral" />
                  <p className="text-sm font-bold text-ink">Ola Maps isn't configured yet</p>
                  <p className="text-xs text-status-neutral max-w-sm">
                    Add an Ola Maps API key under Configuration → Maps to render this page's live map. The stats above already reflect real data.
                  </p>
                </div>
              ) : coverage ? (
                <Map
                  initialViewState={{ longitude: coverage.shop.lng, latitude: coverage.shop.lat, zoom: 12 }}
                  mapStyle={olaStyleQuery.data.styleUrl}
                  style={{ width: '100%', height: '100%' }}
                >
                  <NavigationControl position="top-left" />

                  {radiusGeoJson && (
                    <Source id="delivery-radius" type="geojson" data={radiusGeoJson}>
                      <Layer {...radiusFillLayer} />
                      <Layer {...radiusLineLayer} />
                    </Source>
                  )}

                  {pincodeBoundariesGeoJson && (
                    <Source id="pincode-boundaries" type="geojson" data={pincodeBoundariesGeoJson}>
                      <Layer {...boundaryFillLayer} />
                      <Layer {...boundaryLineLayer} />
                    </Source>
                  )}

                  <Marker longitude={coverage.shop.lng} latitude={coverage.shop.lat} anchor="bottom">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg ring-2 ring-white">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                  </Marker>

                  {coverage.customers.map((c) => (
                    <Marker
                      key={c.userId}
                      longitude={c.lng}
                      latitude={c.lat}
                      anchor="center"
                      onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedCustomer(c); setSelectedRiderId(null); }}
                    >
                      <div
                        className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow cursor-pointer ${c.hasActiveOrder ? 'bg-status-info' : 'bg-rose-300'}`}
                        title={c.name || 'Customer'}
                      />
                    </Marker>
                  ))}

                  {riders.map((r) => {
                    const live = livePositions[r.id];
                    const lat = live?.lat ?? r.current_lat;
                    const lng = live?.lng ?? r.current_lng;
                    if (lat == null || lng == null) return null;
                    return (
                      <Marker
                        key={r.id}
                        longitude={lng}
                        latitude={lat}
                        anchor="center"
                        onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedRiderId(r.id); setSelectedCustomer(null); }}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg ring-2 ring-white cursor-pointer">
                          <Bike className="h-3.5 w-3.5" />
                        </div>
                      </Marker>
                    );
                  })}

                  {selectedCustomer && (
                    <Popup
                      longitude={selectedCustomer.lng}
                      latitude={selectedCustomer.lat}
                      anchor="bottom"
                      offset={12}
                      onClose={() => setSelectedCustomer(null)}
                      closeOnClick={false}
                    >
                      <div className="p-1 min-w-[160px]">
                        <p className="text-sm font-bold text-ink">{selectedCustomer.name || 'Unnamed customer'}</p>
                        <p className="text-[11px] text-status-neutral mb-2">
                          {selectedCustomer.pincode || '—'} · {selectedCustomer.hasActiveOrder ? 'Has an active order' : 'No active order'}
                        </p>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full"
                          onClick={() => navigate(`/crm?customer=${selectedCustomer.userId}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </Popup>
                  )}

                  {selectedRider && selectedRider.current_lat != null && selectedRider.current_lng != null && (
                    <Popup
                      longitude={livePositions[selectedRider.id]?.lng ?? selectedRider.current_lng}
                      latitude={livePositions[selectedRider.id]?.lat ?? selectedRider.current_lat}
                      anchor="bottom"
                      offset={12}
                      onClose={() => setSelectedRiderId(null)}
                      closeOnClick={false}
                    >
                      <div className="p-1 min-w-[160px]">
                        <p className="text-sm font-bold text-ink">{selectedRider.name}</p>
                        <p className="text-[11px] text-status-neutral">{selectedRider.vehicle_type || 'Rider'}</p>
                        <p className="text-[11px] text-status-neutral mt-1">
                          {selectedRider.delivery_status ? `Delivering — ${selectedRider.delivery_status.replace(/_/g, ' ')}` : 'No active delivery'}
                        </p>
                      </div>
                    </Popup>
                  )}
                </Map>
              ) : null}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CoverageMapPage;
