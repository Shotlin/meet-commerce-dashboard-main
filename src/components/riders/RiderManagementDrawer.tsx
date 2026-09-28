import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { shopManagementService, type Shop } from '../../services/shopManagementService';
import {
  riderMgmtService,
  type AdminRider,
  type RiderCollection,
  type RiderDocument,
  type RiderEarnings,
  type RiderSettlement,
  type RiderStoreAssignment,
} from '../../services/riderMgmtService';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const DOCUMENT_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar (front)',
  aadhaar_back: 'Aadhaar (back)',
  license: 'Driving licence',
  vehicle_rc: 'Vehicle RC',
  pan: 'PAN card',
  photo: 'Profile photo',
  bank_proof: 'Bank proof',
};

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
  // A shop-scoped session (real SHOP_ADMIN/SHOP_MANAGER login — see
  // AuthContext/sessionManager's 2026-09-28 shop-scope fix) gets the
  // single-shop toggle below instead of HQ's multi-shop editor; the
  // backend enforces this exact same split server-side regardless of
  // what this renders (a shop-staff JWT can never reach the full-replace
  // endpoint at all).
  const { myShopId, myShopName } = useAuth();

  const [assignments, setAssignments] = useState<RiderStoreAssignment[]>([]);
  const [collections, setCollections] = useState<RiderCollection[]>([]);
  const [settlements, setSettlements] = useState<RiderSettlement[]>([]);
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [earnings, setEarnings] = useState<RiderEarnings | null>(null);
  const [reviewingDoc, setReviewingDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // HQ assignment editor state: shop ids the toggles represent + the set
  // currently marked active (dirty → Save bar appears).
  const [assignmentChoices, setAssignmentChoices] = useState<
    { shopId: string; shopName: string; active: boolean }[]
  >([]);
  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  // Shop picker for HQ's "Add shop" control — replaces the old raw-UUID
  // prompt() with a real dropdown of actual shop names.
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [shopToAdd, setShopToAdd] = useState('');

  // Shop-scoped "my shop" toggle state.
  const [savingMyShop, setSavingMyShop] = useState(false);

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
      const [a, c, s, d, e] = await Promise.all([
        riderMgmtService.getStoreAssignments(rider.id),
        riderMgmtService.getCollections(rider.id),
        riderMgmtService.getSettlements(rider.id),
        riderMgmtService.getDocuments(rider.id),
        riderMgmtService.getEarnings(rider.id),
      ]);
      setDocuments(d);
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
      setEarnings(e);
      const cash = c
        .filter((row) => row.status === 'COLLECTED')
        .reduce((sum, row) => sum + (Number(row.cash_amount) || 0), 0);
      setPendingCash(cash);
      setAssignmentsDirty(false);
      // HQ only: the shop picker needs the real roster. A shop-scoped
      // session has nothing to pick from (it can only toggle its own
      // shop) so this never fires for them.
      if (!myShopId) {
        try {
          setAllShops(await shopManagementService.getShops());
        } catch {
          // Non-fatal — the picker just shows no options; every other
          // section of the drawer still works.
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rider detail');
    } finally {
      setLoading(false);
    }
  }, [rider.id, myShopId]);

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
    const shopId = shopToAdd;
    if (!shopId || assignmentChoices.some((c) => c.shopId === shopId)) return;
    const shop = allShops.find((s) => s.id === shopId);
    setAssignmentChoices((prev) => [
      ...prev,
      { shopId, shopName: shop?.name || shopId, active: true },
    ]);
    setAssignmentsDirty(true);
    setShopToAdd('');
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

  // Shop-scoped counterpart to the HQ editor above — touches only the
  // caller's own shop (the backend never accepts a client-supplied shop
  // id for this call at all, see riderMgmtService.setMyShopAssignment).
  const myShopAssignment = myShopId
    ? assignments.find((a) => a.shop_id === myShopId && a.is_active)
    : undefined;
  const toggleMyShopAssignment = async () => {
    setSavingMyShop(true);
    setError(null);
    try {
      await riderMgmtService.setMyShopAssignment(rider.id, !myShopAssignment);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update assignment');
    } finally {
      setSavingMyShop(false);
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

  const reviewDocument = async (doc: RiderDocument, status: 'APPROVED' | 'REJECTED') => {
    let note: string | undefined;
    if (status === 'REJECTED') {
      const reason = window.prompt(
        'Why is this document rejected? The rider sees this and can upload a new one.',
      );
      if (reason === null) return;
      note = reason.trim() || undefined;
    }
    setReviewingDoc(doc.id);
    setError(null);
    try {
      await riderMgmtService.verifyDocument(rider.id, doc.id, status, note);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    } finally {
      setReviewingDoc(null);
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
              {rider.is_online && <Badge variant="success">Online</Badge>}
              {rider.is_busy && <Badge variant="warning">Busy</Badge>}
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

              {/* KYC documents */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  KYC DOCUMENTS
                </h4>
                {documents.length === 0 ? (
                  <p className="text-xs text-status-neutral">
                    The rider has not uploaded any documents yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-2.5 border border-border rounded-[12px]"
                      >
                        <a href={doc.url} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={doc.url}
                            alt={DOCUMENT_LABELS[doc.type] || doc.type}
                            className="h-12 w-12 rounded-[8px] object-cover border border-border"
                          />
                        </a>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink">
                            {DOCUMENT_LABELS[doc.type] || doc.type}
                          </p>
                          <p className="text-[10px] text-status-neutral">
                            Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            {doc.status === 'REJECTED' && doc.rejection_reason
                              ? ` · ${doc.rejection_reason}`
                              : ''}
                          </p>
                        </div>
                        <Badge
                          variant={
                            doc.status === 'APPROVED'
                              ? 'success'
                              : doc.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {doc.status === 'APPROVED'
                            ? 'Approved'
                            : doc.status === 'REJECTED'
                              ? 'Rejected'
                              : 'Pending'}
                        </Badge>
                        {doc.status !== 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reviewingDoc === doc.id}
                            onClick={() => reviewDocument(doc, 'APPROVED')}
                          >
                            Approve
                          </Button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reviewingDoc === doc.id}
                            onClick={() => reviewDocument(doc, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Store assignments — shop-scoped sessions get a single
                  toggle for their own shop; HQ gets the full multi-shop
                  editor (a real dropdown now, not a raw-UUID prompt). */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  STORE ELIGIBILITY
                </h4>
                <p className="text-[11px] text-status-neutral">
                  Riders with active assignments receive offers only for these stores
                  (when RIDER_STORE_SCOPING is enabled on the backend).
                </p>

                {myShopId ? (
                  <div className="flex items-center gap-3 p-2.5 border border-border rounded-[12px]">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-ink">{myShopName || 'Your shop'}</p>
                      <p className="text-[11px] text-status-neutral">
                        {myShopAssignment ? 'This rider is assigned to your shop.' : 'Not assigned to your shop yet.'}
                      </p>
                    </div>
                    <Button
                      variant={myShopAssignment ? 'outline' : 'primary'}
                      size="sm"
                      disabled={savingMyShop}
                      onClick={toggleMyShopAssignment}
                    >
                      {savingMyShop
                        ? 'Saving…'
                        : myShopAssignment
                          ? 'Unassign from my shop'
                          : 'Assign to my shop'}
                    </Button>
                  </div>
                ) : (
                  <>
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
                              className="accent-ink"
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
                      <select
                        value={shopToAdd}
                        onChange={(e) => setShopToAdd(e.target.value)}
                        className="flex-1 p-2 text-xs border border-border rounded-[12px] bg-white"
                      >
                        <option value="">Add a shop…</option>
                        {allShops
                          .filter((s) => !assignmentChoices.some((c) => c.shopId === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                      <Button variant="outline" size="sm" disabled={!shopToAdd} onClick={addAssignmentShop}>
                        Add
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
                  </>
                )}
              </section>

              {/* Earnings — so a shop can settle up with the rider */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-status-neutral tracking-wide">
                  EARNINGS
                </h4>
                {(() => {
                  const today = earnings?.daily.find((d) => d.date === todayIso());
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 border border-border rounded-[12px]">
                        <p className="text-[10px] text-status-neutral">Today</p>
                        <p className="text-sm font-bold text-ink font-mono-num">
                          ₹{(today?.total ?? 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-status-neutral">
                          {today?.deliveries ?? 0} deliver{(today?.deliveries ?? 0) === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                      <div className="p-2.5 border border-border rounded-[12px]">
                        <p className="text-[10px] text-status-neutral">All-time</p>
                        <p className="text-sm font-bold text-ink font-mono-num">
                          ₹{(earnings?.summary.total ?? 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-status-neutral">
                          {earnings?.summary.delivery_count ?? 0} deliveries
                        </p>
                      </div>
                    </div>
                  );
                })()}
                {earnings && earnings.daily.length > 0 && (
                  <div className="space-y-1">
                    {earnings.daily.slice(0, 7).map((d) => (
                      <div
                        key={d.date}
                        className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-status-neutral"
                      >
                        <span>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className="font-mono-num text-ink">
                          ₹{Number(d.total).toFixed(2)} · {d.deliveries} deliver{d.deliveries === 1 ? 'y' : 'ies'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
