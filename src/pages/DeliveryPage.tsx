import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { deliveryService, LiveRider } from '../services/deliveryService';
import { Link } from 'react-router-dom';
import { Truck, MapPin, RefreshCw, AlertCircle, Phone, Users } from 'lucide-react';

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
};

/** "just now" / "4 min ago" / "2 h ago" for a rider's last GPS fix. */
function fixAge(iso: string | null | undefined): { label: string; stale: boolean } | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return { label: 'just now', stale: false };
  if (minutes < 60) return { label: `${minutes} min ago`, stale: minutes >= 10 };
  return { label: `${Math.round(minutes / 60)} h ago`, stale: true };
}

const GpsFreshness: React.FC<{ iso: string | null | undefined }> = ({ iso }) => {
  const age = fixAge(iso);
  if (!age) return null;
  return (
    <p className={`mt-1.5 text-[11px] ${age.stale ? 'text-status-warning' : 'text-status-neutral'}`}>
      Last GPS update {age.label}
    </p>
  );
};

export const DeliveryPage: React.FC = () => {
  const [riders, setRiders] = useState<LiveRider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveryData(true);
    // 10-second real-time telemetry polling interval
    const timer = setInterval(() => {
      fetchDeliveryData(false);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchDeliveryData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const ridersData = await deliveryService.getLiveRiders();
      setRiders(ridersData);
    } catch (err: any) {
      console.error('[DeliveryPage] API error:', err);
      if (showLoading) {
        setError(err.message || 'Unable to load the live rider roster. Check your connection and retry.');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-ink-2 animate-spin mx-auto" />
        <p className="text-xs font-bold text-ink">Loading live rider roster…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">Unable to Load Delivery Data</h3>
        <p className="text-xs text-status-neutral">{error}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => fetchDeliveryData(true)}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const onDelivery = riders.filter((r) => r.delivery_status !== null);
  const idle = riders.filter((r) => r.delivery_status === null);

  return (
    <div>
      <PageHeader
        title="Delivery Command & Rider Fleet Map"
        subtitle="Live online-rider roster and active delivery assignments."
        badge={<Badge variant="success" icon={<Truck className="w-3.5 h-3.5" />}>{riders.length} Online Riders</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/riders">
              <Button variant="outline" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
                Rider Management
              </Button>
            </Link>
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => fetchDeliveryData(true)}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card title="Online Riders">
          <p className="text-2xl font-extrabold text-ink font-mono-num">{riders.length}</p>
        </Card>
        <Card title="On a Delivery">
          <p className="text-2xl font-extrabold text-violet-600 font-mono-num">{onDelivery.length}</p>
        </Card>
        <Card title="Idle">
          <p className="text-2xl font-extrabold text-status-neutral font-mono-num">{idle.length}</p>
        </Card>
      </div>

      {/* Active Rider Status Table Log */}
      <Card title="Live Rider Fleet Roster">
        {riders.length === 0 ? (
          <p className="text-xs text-status-neutral text-center py-8">No riders are currently online.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {riders.map((r) => (
              <div key={r.id} className="p-3.5 bg-rose-50/50 border border-border rounded-[12px] hover:bg-rose-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-ink">{r.name}</h4>
                    <p className="text-[11px] text-status-neutral flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {r.phone}
                    </p>
                  </div>
                  <Badge variant={r.delivery_status ? 'violet' : 'neutral'}>
                    {r.delivery_status ? (DELIVERY_STATUS_LABEL[r.delivery_status] ?? r.delivery_status) : 'Idle'}
                  </Badge>
                </div>

                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono-num">
                  <span className="text-status-neutral">
                    {r.vehicle_type || 'Vehicle N/A'}
                  </span>
                  {r.current_lat != null && r.current_lng != null ? (
                    <span className="text-ink font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {r.current_lat.toFixed(3)}, {r.current_lng.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-status-neutral">No GPS fix</span>
                  )}
                </div>
                <GpsFreshness iso={r.location_updated_at} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
