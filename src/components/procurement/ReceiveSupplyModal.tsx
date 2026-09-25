import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useReceiveSupply } from '../../hooks/useProcurement';
import type { ReceiveLineInput } from '../../services/procurementService';
import type { SupplyOrderDetail } from '../../types/procurement.types';

const ISSUE_CATEGORIES = [
  { value: '', label: '—' },
  { value: 'QUANTITY_SHORTAGE', label: 'Quantity shortage' },
  { value: 'QUALITY', label: 'Quality problem' },
  { value: 'FRESHNESS', label: 'Freshness' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'LATE_DELIVERY', label: 'Late delivery' },
  { value: 'DAMAGED', label: 'Damaged goods' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];

const inputClass =
  'w-full px-2.5 py-1.5 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30';
const labelClass = 'block text-[10px] font-bold text-muted mb-1 uppercase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supply: SupplyOrderDetail;
  products: Array<{ id: string; name: string }>;
}

export interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  supply: SupplyOrderDetail;
  products: Array<{ id: string; name: string }>;
}

export default function ReceiveSupplyModal({ isOpen, onClose, supply, products }: ReceiveModalProps) {
  const receiveMutation = useReceiveSupply();

  const [lines, setLines] = useState<Record<string, ReceiveLineInput>>(() =>
    Object.fromEntries(
      (supply.items ?? []).map((item) => [
        item.id,
        {
          supply_order_item_id: item.id,
          received_quantity: Number(item.agreed_quantity),
          accepted_quantity: Number(item.agreed_quantity),
          rejected_quantity: 0,
        },
      ]),
    ),
  );
  const [note, setNote] = useState('');

  function updateLine(itemId: string, patch: Partial<ReceiveLineInput>) {
    setLines((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  }

  async function submit() {
    await receiveMutation.mutateAsync({
      supplyId: supply.id,
      payload: { items: Object.values(lines), note: note || undefined },
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm receipt"
      subtitle={`${supply.supply_number} — ${supply.shop_name ?? ''}`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={receiveMutation.isPending} onClick={submit}>
            Confirm Receipt
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[11px] text-muted">
          Record actual quantities. Only accepted quantity enters inventory. Received may differ from
          requested — the variance is preserved.
        </p>
        <div className="space-y-3">
          {(supply.items ?? []).map((item) => {
            const line = lines[item.id];
            return (
              <div key={item.id} className="rounded-[12px] border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-ink">{item.item_name}</span>
                  <span className="text-[11px] text-muted">
                    Agreed: {Number(item.agreed_quantity)} {item.unit} × ₹{Number(item.agreed_unit_price)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className={labelClass}>Received</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={line.received_quantity}
                      onChange={(e) => updateLine(item.id, { received_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Accepted</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={line.accepted_quantity}
                      onChange={(e) => updateLine(item.id, { accepted_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rejected</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={line.rejected_quantity}
                      onChange={(e) => updateLine(item.id, { rejected_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Inventory product</label>
                    <select
                      className={inputClass}
                      value={line.product_id ?? ''}
                      onChange={(e) => updateLine(item.id, { product_id: e.target.value || undefined })}
                    >
                      <option value="">Skip inventory</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className={labelClass}>Issue category</label>
                    <select
                      className={inputClass}
                      value={line.issue_category ?? ''}
                      onChange={(e) => updateLine(item.id, { issue_category: e.target.value || undefined })}
                    >
                      {ISSUE_CATEGORIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Issue note</label>
                    <input
                      className={inputClass}
                      value={line.issue_note ?? ''}
                      onChange={(e) => updateLine(item.id, { issue_note: e.target.value || undefined })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <label className={labelClass}>Receipt note</label>
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — e.g. received at cold room A"
          />
        </div>
      </div>
    </Modal>
  );
}
