import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  riderMgmtService,
  type AdminRider,
  type RiderCollection,
  type RiderSettlement,
  type RiderStoreAssignment,
} from '../../services/riderMgmtService';

interface Props {
  rider: AdminRider;
  onClose: () => void;
}

/**
 * Rider management drawer (Big Phase 17 dashboard alignment):
 * the operational control surface for one rider — store eligibility
 * assignments, approve/suspend, COD collections + cash settlement,
 * and the business UPI id behind their collect-sheet QR.
 *
 * Backed by the real admin endpoints built in the rider rebuild's
 * Phases 6 and 14 — no mocks.
 */
export const RiderManagementDrawer: React.FC<Props> = ({ rider, onClose }) => {
  const [assignments, setAssignments] = useState<RiderStoreAssignment[]>([]);
  const [collections, setCollections] = useState<RiderCollection[]>([]);
  const [settlements, setSettlements] = useState<RiderSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment editor state: shop ids the toggles represent + the set
  // currently marked active (dirty → Save bar appears).
  const [assignmentChoices, setAssignmentChoices] = useState<
    { shopId: string; shopName: string; active: boolean }[]
  >([]);
  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Settlement form state.
  const [pendingCash, setPendingCash] = useState(0);
  const [settleAmount, setSettleAmount] = useState('');
  const [settling, setSettling] = useState(false);

  // UPI form state.
  const [upiValue, setUpiValue] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, s] = await Promise.all([
        riderMgmtService.getStoreAssignments(rider.id),
        riderMgmtService.getCollections(rider.id),
        riderMgmtService.getSettlements(rider.id),
      ]);
      setAssignments(a);
      setAssignmentChoices(
        a.map((row) => ({
          shopId: row.shop_id,
          shopName: row.shop_name,
          active: row.is_active,
        })),
      );
      setCollections(c);
      setSettlements(s);
      const cash = c
        .filter((row) => row.status === 'COLLECTED')
        .reduce((sum, row) => sum + (Number(row.cash_amount) || 0), 0);
      setPendingCash(cash);
      setAssignmentsDirty(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load rider detail');
    } finally {
      setLoading(false);
    }
  }, [rider.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAssignment = (shopId: string) => {
    setAssignmentChoices((prev) =>
      prev.map((choice) =>
        choice.shopId === shopId ? { ...choice, active: !choice.active } : choice,
      ),
    );
    setAssignmentsDirty(true);
  };

  const addAssignmentShop = () => {
    const input = window.prompt('Shop UUID to assign this rider to:');
    if (!input) return;
    const shopId = input.trim();
    if (!shopId || assignmentChoices.some((c) => c.shopId === shopId)) return;
    setAssignmentChoices((prev) => [...prev, { shopId, shopName: shopId, active: true }]);
    setAssignmentsDirty(true);
  };

  const saveAssignments = async () => {
    setSavingAssignments(true);
    setError(null);
    try {
      await riderMgmtService.replaceStoreAssignments(
        rider.id,
        assignmentChoices.filter((c) => c.active).map((c) => c.shopId),
      );
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const recordSettlement = async () => {
    const amount = Number(settleAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a settlement amount');
      return;
    }
    setSettling(true);
    setError(null);
    try {
      await riderMgmtService.createSettlement(rider.id, {
        amount,
        method: 'CASH',
        reference: `manual-settlement-${new Date().toISOString().slice(0, 10)}`,
      });
      setSettleAmount('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setSettling(false);
    }
  };

  const saveUpi = async () => {
    const value = upiValue.trim();
    if (!value || !value.includes('@')) {
      setError('Enter a valid UPI id (name@bank)');
      return;
    }
    setSavingUpi(true);
    setError(null);
    try {
      await riderMgmtService.setBusinessUpi(rider.id, value);
      setUpiValue('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update business UPI');
    } finally {
      setSavingUpi(false);
    }
  };

  const toggleSuspend = async () => {
    setError(null);
    try {
      await riderMgmtService.setSuspended(rider.id, rider.is_active);
      // The parent list refreshes on close; flip locally for immediacy.
      rider.is_active = !rider.is_active;
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update suspension');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-start justify-between z-10">
          <div>
            <h3 className="text-sm font-bold text-ink">{rider.name || 'Rider'}</h3>
            <p className="text-[11px] text-status-neutral">
              {rider.phone} · {rider.vehicle_type || 'Vehicle N/A'}{' '}
              {rider.vehicle_number || ''}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant={rider.is_approved ? 'success' : 'neutral'}>
                {rider.is_approved ? 'Approved' : 'Pending'}
              </Badge>
              <Badge variant={rider.is_active ? 'neutral' : 'danger'}>
                {rider.is_active ? 'Active' : 'Suspended'}
              </Badge>
              {rider.is_online && <Badge variant="brand">Online</Badge>}
              {rider.is_busy && <Badge variant="brand">Busy</Badge>}
            </div>
          </div>
          <button
            className="text-status-neutral hover:text-ink text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {error && (
            <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-xs text-status-danger">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-xs text-status-neutral text-center py-8">Loading rider detail…</p>
          ) : (
            <>
              {/* Approve / suspend */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  ACCOUNT
                </h4>
                <div className="flex gap-2">
                  {!rider.is_approved && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        await riderMgmtService.setApproval(rider.id, true);
                        rider.is_approved = true;
                        onClose();
                      }}
                    >
                      Approve rider
                    </Button>
                  )}
                  <Button
                    variant={rider.is_active ? 'outline' : 'primary'}
                    size="sm"
                    onClick={toggleSuspend}
                  >
                    {rider.is_active ? 'Suspend (forces offline)' : 'Unsuspend'}
                  </Button>
                </div>
              </section>

              {/* Store assignments */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  STORE ELIGIBILITY
                </h4>
                <p className="text-[11px] text-status-neutral">
                  Riders with active assignments receive offers only for these stores
                  (when RIDER_STORE_SCOPING is enabled on the backend).
                </p>
                {assignmentChoices.length === 0 ? (
                  <p className="text-xs text-status-neutral">
                    No assignments — the rider is store-eligible nowhere.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {assignmentChoices.map((choice) => (
                      <label
                        key={choice.shopId}
                        className="flex items-center gap-2 p-2.5 border border-border rounded-[12px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={choice.active}
                          onChange={() => toggleAssignment(choice.shopId)}
                          className="accent-brand-berry"
                        />
                        <span className="text-xs text-ink">{choice.shopName}</span>
                        <span className="ml-auto text-[10px] font-mono-num text-status-neutral">
                          {choice.shopId.slice(0, 8)}…
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addAssignmentShop}>
                    Add shop id
                  </Button>
                  {assignmentsDirty && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={savingAssignments}
                      onClick={saveAssignments}
                    >
                      {savingAssignments ? 'Saving…' : 'Save assignments'}
                    </Button>
                  )}
                </div>
              </section>

              {/* Collections + settlements */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  COD COLLECTIONS
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-status-neutral">Cash in hand:</span>
                  <span
                    className={
                      pendingCash > 0
                        ? 'font-bold text-status-warning font-mono-num'
                        : 'font-bold text-status-neutral font-mono-num'
                    }
                  >
                    ₹{pendingCash.toFixed(2)}
                  </span>
                </div>
                {collections.length === 0 ? (
                  <p className="text-xs text-status-neutral">No COD collections recorded.</p>
                ) : (
                  <div className="space-y-1">
                    {collections.slice(0, 8).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between p-2.5 border border-border rounded-[12px] text-xs"
                      >
                        <div>
                          <span className="font-bold text-ink">
                            {row.order_number || row.order_id.slice(0, 8)}
                          </span>
                          <span className="ml-2 text-status-neutral font-mono-num">
                            cash ₹{Number(row.cash_amount).toFixed(0)} · UPI ₹
                            {Number(row.upi_amount).toFixed(0)}
                          </span>
                        </div>
                        <Badge variant={row.status === 'SETTLED' ? 'success' : 'neutral'}>
                          {row.status === 'SETTLED' ? 'Settled' : 'Collected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Settle cash (max ₹${pendingCash.toFixed(2)})`}
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      className="w-full p-2 text-xs border border-border rounded-[12px]"
                      disabled={pendingCash <= 0}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pendingCash <= 0 || settling}
                    onClick={recordSettlement}
                  >
                    {settling ? 'Recording…' : 'Record settlement'}
                  </Button>
                </div>
                {settlements.length > 0 && (
                  <p className="text-[11px] text-status-neutral">
                    Last settlement:{' '}
                    {Number(settlements[0].amount).toFixed(2)} ·{' '}
                    {settlements[0].method} ·{' '}
                    {new Date(settlements[0].created_at).toLocaleDateString()}
                  </p>
                )}
              </section>

              {/* Business UPI */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  BUSINESS UPI (COLLECT-SHEET QR)
                </h4>
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="name@bank"
                    value={upiValue}
                    onChange={(e) => setUpiValue(e.target.value)}
                    className="flex-1 p-2 text-xs border border-border rounded-[12px]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={savingUpi || !upiValue.includes('@')}
                    onClick={saveUpi}
                  >
                    {savingUpi ? 'Saving…' : 'Save UPI'}
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
