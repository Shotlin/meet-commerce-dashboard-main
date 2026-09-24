import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { RecordSettlementPayload, SettlementMethod } from '../../types/order.types';

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountDue: number;
  onConfirm: (payload: RecordSettlementPayload) => void;
  isSubmitting: boolean;
}

/**
 * "Record Payment / Settle Payment" — for an order delivered outside the
 * rider app / online-payment flow, lets an admin/finance user record what
 * was actually collected (full or partial). Never lets the entered amount
 * exceed what's genuinely still due; the backend re-validates this same
 * rule server-side against the real, current outstanding balance (never
 * trust this client-side number alone for the actual write).
 */
export function SettlementModal({ open, onOpenChange, amountDue, onConfirm, isSubmitting }: Props) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<SettlementMethod>('CASH');
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [reference, setReference] = useState('');
  const [methodNote, setMethodNote] = useState('');
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount(amountDue > 0 ? amountDue.toFixed(2) : '');
    setMethod('CASH');
    setCashAmount('');
    setUpiAmount('');
    setReference('');
    setMethodNote('');
    setInternalNote('');
  }, [open, amountDue]);

  const amountNum = Number(amount) || 0;
  const cashNum = Number(cashAmount) || 0;
  const upiNum = Number(upiAmount) || 0;
  const splitMismatch = method === 'CASH_UPI' && Math.abs(cashNum + upiNum - amountNum) > 0.01;
  const exceedsOutstanding = amountNum > amountDue + 0.01;
  const otherNoteMissing = method === 'OTHER' && !methodNote.trim();
  const invalid = amountNum <= 0 || splitMismatch || exceedsOutstanding || otherNoteMissing;
  const remaining = Math.max(0, Number((amountDue - amountNum).toFixed(2)));

  const handleConfirm = () => {
    if (invalid) return;
    onConfirm({
      amount: amountNum,
      method,
      ...(method === 'CASH_UPI' ? { cashAmount: cashNum, upiAmount: upiNum } : {}),
      ...((method === 'UPI' || method === 'CASH_UPI') && reference.trim() ? { reference: reference.trim() } : {}),
      ...(method === 'OTHER' ? { methodNote: methodNote.trim() } : {}),
      ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Outstanding balance: <span className="font-semibold text-ink">{fmtCurrency(amountDue)}</span></p>

          <div>
            <label className="text-xs font-semibold">Amount Received</label>
            <Input
              type="number" min={0} step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as SettlementMethod)}
              className="mt-1 w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CASH_UPI">Cash + UPI</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {method === 'CASH_UPI' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold">Cash Amount</label>
                <Input type="number" min={0} step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">UPI Amount</label>
                <Input type="number" min={0} step="0.01" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              {splitMismatch && <p className="col-span-2 text-xs text-red-600">Cash Amount + UPI Amount must equal the amount received.</p>}
            </div>
          )}

          {(method === 'UPI' || method === 'CASH_UPI') && (
            <div>
              <label className="text-xs font-semibold">Transaction / UTR ID (optional)</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 h-8 text-xs" placeholder="e.g. 402812xxxxx" />
            </div>
          )}

          {method === 'OTHER' && (
            <div>
              <label className="text-xs font-semibold">Payment Method Note (required)</label>
              <Input value={methodNote} onChange={(e) => setMethodNote(e.target.value)} className="mt-1 h-8 text-xs" placeholder="e.g. Bank transfer, cheque..." />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold">Internal Settlement Note (optional)</label>
            <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} className="mt-1 text-xs" />
          </div>

          {exceedsOutstanding && (
            <p className="text-xs text-red-600">Amount received cannot exceed the outstanding balance ({fmtCurrency(amountDue)}).</p>
          )}
          {amountNum > 0 && !exceedsOutstanding && !splitMismatch && (
            <p className="text-xs text-muted-foreground">
              {remaining > 0.01
                ? `₹${remaining.toFixed(2)} will remain due — order becomes Partially Paid.`
                : 'This fully settles the order — order becomes Paid.'}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={invalid || isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? 'Recording…' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
