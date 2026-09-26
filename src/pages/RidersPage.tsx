import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { RiderManagementDrawer } from '../components/riders/RiderManagementDrawer';
import {
  riderMgmtService,
  type AdminRider,
} from '../services/riderMgmtService';
import { Users, Search, RefreshCw, AlertCircle } from 'lucide-react';

type StatusFilter = '' | 'online' | 'offline' | 'pending' | 'suspended';

/**
 * Rider management page (Big Phase 17 dashboard alignment): the list
 * over the admin riders API with the busy badge (has a live delivery),
 * search/status filters, and a per-rider management drawer.
 */
export const RidersPage: React.FC = () => {
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminRider | null>(null);

  const fetchRiders = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setError(null);
      try {
        const { riders: rows, total: totalCount } =
          await riderMgmtService.listRiders({
            page,
            limit: 25,
            search: search.trim() || undefined,
            status: (status || undefined) as any,
          });
        setRiders(rows);
        setTotal(totalCount);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch riders');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    fetchRiders(true);
  }, [fetchRiders]);

  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <PageHeader
        title="Rider Management"
        subtitle="Roster, eligibility, COD collections and settlement controls."
        badge={
          <Badge variant="brand" icon={<Users className="w-3.5 h-3.5" />}>
            {total} Riders
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => fetchRiders(true)}
          >
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral" />
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-[12px]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as StatusFilter);
          }}
          className="px-3 py-2 text-xs border border-border rounded-[12px] bg-white"
        >
          <option value="">All statuses</option>
          <option value="online">Online now</option>
          <option value="offline">Offline</option>
          <option value="pending">Awaiting approval</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && (
        <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 mb-4">
          <AlertCircle className="w-6 h-6 text-status-danger mx-auto" />
          <p className="text-xs text-status-danger">{error}</p>
          <Button variant="primary" size="sm" onClick={() => fetchRiders(true)}>
            Retry
          </Button>
        </div>
      )}

      <Card title={`Riders${total ? ` (${total})` : ''}`}>
        {isLoading ? (
          <p className="text-xs text-status-neutral text-center py-8">Loading riders…</p>
        ) : riders.length === 0 ? (
          <p className="text-xs text-status-neutral text-center py-8">
            No riders match the current filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-status-neutral border-b border-border">
                  <th className="py-2 pr-3 font-bold">Rider</th>
                  <th className="py-2 pr-3 font-bold">Status</th>
                  <th className="py-2 pr-3 font-bold">Vehicle</th>
                  <th className="py-2 pr-3 font-bold">Rating</th>
                  <th className="py-2 pr-3 font-bold">Deliveries</th>
                  <th className="py-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 last:border-0 hover:bg-offwhite/60"
                  >
                    <td className="py-2.5 pr-3">
                      <p className="font-bold text-ink">{r.name || 'Unnamed'}</p>
                      <p className="text-[11px] text-status-neutral">{r.phone}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={r.is_approved ? 'success' : 'neutral'}>
                          {r.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                        {r.is_online && <Badge variant="brand">Online</Badge>}
                        {r.is_busy && <Badge variant="brand">Busy</Badge>}
                        {!r.is_active && <Badge variant="danger">Suspended</Badge>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-status-neutral">
                      {r.vehicle_type || '—'} {r.vehicle_number || ''}
                    </td>
                    <td className="py-2.5 pr-3 font-mono-num">
                      {r.rating != null ? Number(r.rating).toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 pr-3 font-mono-num">
                      {r.total_deliveries ?? '—'}
                    </td>
                    <td className="py-2.5">
                      <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-status-neutral font-mono-num">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selected && (
        <RiderManagementDrawer rider={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};
