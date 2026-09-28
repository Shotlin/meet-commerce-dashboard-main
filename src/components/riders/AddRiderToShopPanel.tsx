import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { riderMgmtService, type RiderSearchResult } from '../../services/riderMgmtService';
import { Search, UserPlus } from 'lucide-react';

interface Props {
  /** Display name of the caller's own shop (for the button/copy). */
  shopName: string | null;
  /** Called after a real assign succeeds, so the parent roster refreshes. */
  onAssigned: () => void;
}

/**
 * "Add a rider to my shop" — the shop-scoped counterpart to HQ's full
 * roster + drawer workflow. Riders self-register via the rider app (no
 * dashboard "create account" flow exists, or is needed — see
 * riders.routes.js's own doc comment); a store manager's real job here
 * is finding a rider who already has an account and assigning them to
 * their own shop, which is exactly this search-by-phone + one-click
 * assign action. Only ever touches the caller's own shop — see
 * `riderMgmtService.setMyShopAssignment`'s own doc comment for why the
 * full multi-shop editor is deliberately never exposed here.
 */
export const AddRiderToShopPanel: React.FC<Props> = ({ shopName, onAssigned }) => {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<RiderSearchResult | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const search = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setSearching(true);
    setError(null);
    setResult(undefined);
    try {
      const found = await riderMgmtService.searchByPhone(trimmed);
      setResult(found);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const assign = async () => {
    if (!result) return;
    setAssigning(true);
    setError(null);
    try {
      await riderMgmtService.setMyShopAssignment(result.id, true);
      setResult({ ...result, assigned_to_my_shop: true });
      onAssigned();
    } catch (err: any) {
      setError(err.message || 'Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Card title="Add a rider to your shop">
      <p className="text-[11px] text-status-neutral mb-3">
        Riders create their own account in the Freashcut Rider app first. Search by the
        phone number they signed up with, then assign them to{' '}
        <span className="font-bold text-ink">{shopName || 'your shop'}</span> — no HQ request
        needed.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral" />
          <input
            type="tel"
            placeholder="Rider's phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setResult(undefined);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search();
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-[12px]"
          />
        </div>
        <Button variant="outline" size="sm" disabled={!phone.trim() || searching} onClick={search}>
          {searching ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {error && <p className="text-xs text-status-danger mt-2">{error}</p>}

      {result === null && (
        <p className="text-xs text-status-neutral mt-3">
          No rider account found with that phone number. They need to sign up in the
          Freashcut Rider app first.
        </p>
      )}

      {result && (
        <div className="flex items-center gap-3 mt-3 p-2.5 border border-border rounded-[12px]">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink">{result.name || 'Unnamed rider'}</p>
            <p className="text-[11px] text-status-neutral">
              {result.phone} · {result.vehicle_type || 'Vehicle N/A'} {result.vehicle_number || ''}
            </p>
            <div className="flex gap-1.5 mt-1">
              <Badge variant={result.is_approved ? 'success' : 'neutral'}>
                {result.is_approved ? 'Approved' : 'Pending approval'}
              </Badge>
              {result.is_online && <Badge variant="success">Online</Badge>}
            </div>
          </div>
          {result.assigned_to_my_shop ? (
            <Badge variant="success">Already assigned</Badge>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-3.5 h-3.5" />}
              disabled={assigning}
              onClick={assign}
            >
              {assigning ? 'Assigning…' : 'Assign to my shop'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
