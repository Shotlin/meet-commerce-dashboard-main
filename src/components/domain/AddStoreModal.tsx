import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LocationPicker } from './LocationPicker';
import { queryKeys } from '../../services/queryKeys';
import { shopManagementService, ShopCreateInput, Shop } from '../../services/shopManagementService';
import { useShopScope } from '../../context/ShopScopeContext';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

// Default pin: New Delhi (matches the existing HQ store) so a brand-new
// store's map starts somewhere sensible instead of the middle of the ocean.
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.209;

const emptyForm: ShopCreateInput = {
  name: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  serviceable_pincodes: [],
  delivery_radius_km: 5,
  pincode_only: false,
};

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (shop: Shop) => void;
}

export const AddStoreModal: React.FC<AddStoreModalProps> = ({ isOpen, onClose, onCreated }) => {
  const queryClient = useQueryClient();
  const { refreshShops } = useShopScope();
  const [form, setForm] = useState<ShopCreateInput>(emptyForm);
  const [pincodesText, setPincodesText] = useState('');

  const reset = () => {
    setForm(emptyForm);
    setPincodesText('');
  };

  const createMutation = useMutation({
    mutationFn: (input: ShopCreateInput) => shopManagementService.createShop(input),
    onSuccess: async (shop) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shops.list() });
      await refreshShops();
      reset();
      onCreated(shop);
    },
  });

  const handleClose = () => {
    reset();
    createMutation.reset();
    onClose();
  };

  const canSave =
    form.name.trim() &&
    form.address_line1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.pincode.trim() &&
    Number.isFinite(form.lat) &&
    Number.isFinite(form.lng);

  const handleSave = () => {
    const serviceable_pincodes = pincodesText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    createMutation.mutate({ ...form, serviceable_pincodes });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Store"
      subtitle="Create a new physical FC hub — you can add staff, products, and fine-tune hours after."
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" isLoading={createMutation.isPending} disabled={!canSave} onClick={handleSave}>
            Create Store
          </Button>
        </>
      }
    >
      {createMutation.error && (
        <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5 mb-3">
          {(createMutation.error as Error).message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Store Name</label>
          <input className={inputClass} value={form.name} placeholder="e.g. FreshCuts — Kolkata" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Address Line 1</label>
          <input className={inputClass} value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Address Line 2 (optional)</label>
          <input className={inputClass} value={form.address_line2 ?? ''} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
        </div>

        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Pincode</label>
          <input className={inputClass} value={form.pincode} maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
        </div>
        <div>
          <label className={labelClass}>Delivery Radius (km)</label>
          <input
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            className={inputClass}
            value={form.delivery_radius_km}
            onChange={(e) => setForm({ ...form, delivery_radius_km: Number(e.target.value) })}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Precise Location — drag the pin or click the map</label>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            radiusKm={form.pincode_only ? undefined : form.delivery_radius_km}
            onChange={(lat, lng) => setForm({ ...form, lat, lng })}
          />
          <p className="text-[10px] text-status-neutral mt-1 font-mono-num">
            {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
          </p>
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Also-Serviceable Pincodes (comma-separated, optional)</label>
          <input
            className={inputClass}
            value={pincodesText}
            placeholder="e.g. 700001, 700016, 700019"
            onChange={(e) => setPincodesText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            id="pincode-only"
            checked={form.pincode_only}
            onChange={(e) => setForm({ ...form, pincode_only: e.target.checked })}
          />
          <label htmlFor="pincode-only" className="text-xs font-bold text-ink">
            Only match by pincode list above (ignore delivery radius)
          </label>
        </div>
      </div>
    </Modal>
  );
};
