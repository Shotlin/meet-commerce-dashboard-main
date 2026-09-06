import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { appSettingsService } from '../../services/appSettingsService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

// Same generic app_settings keys `payment-settings.service.js` already reads
// on the backend to gate checkout — confirmed no controller/routes needed,
// writes go through the same GET/PUT /api/v1/admin/settings endpoint
// Phase 2's App Branding panel already proved out.
interface PaymentGatewayForm {
  cod_enabled: boolean;
  razorpay_enabled: boolean;
  wallet_enabled: boolean;
  cod_min_order_amount: string;
  cod_max_amount: string;
}

const emptyForm: PaymentGatewayForm = {
  cod_enabled: true,
  razorpay_enabled: true,
  wallet_enabled: true,
  cod_min_order_amount: '',
  cod_max_amount: '',
};

const QUERY_KEY = ['app-settings'] as const;

export const PaymentGatewayConfigPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: appSettingsService.getAll,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      cod_enabled: settings.cod_enabled?.value ?? true,
      razorpay_enabled: settings.razorpay_enabled?.value ?? true,
      wallet_enabled: settings.wallet_enabled?.value ?? true,
      cod_min_order_amount: settings.cod_min_order_amount?.value != null ? String(settings.cod_min_order_amount.value) : '',
      cod_max_amount: settings.cod_max_amount?.value != null ? String(settings.cod_max_amount.value) : '',
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => appSettingsService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      cod_enabled: form.cod_enabled,
      razorpay_enabled: form.razorpay_enabled,
      wallet_enabled: form.wallet_enabled,
      cod_min_order_amount: form.cod_min_order_amount === '' ? null : Number(form.cod_min_order_amount),
      cod_max_amount: form.cod_max_amount === '' ? null : Number(form.cod_max_amount),
    });
  };

  return (
    <Card
      title="Payment Gateway & Serviceability Matrix"
      subtitle="Which payment methods are offered at checkout — enforced by the same settings the cart and order-placement flow read."
      action={
        <div className="flex items-center gap-2">
          <Badge variant="brand" icon={<ShieldCheck className="w-3 h-3" />}>Enforced</Badge>
          <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={handleSave} isLoading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load settings: {(error as Error).message}</p>
      ) : isLoading ? (
        <p className="text-xs text-status-neutral p-3">Loading settings…</p>
      ) : (
        <div className="space-y-3">
          {saveMutation.error && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(saveMutation.error as Error).message}
            </p>
          )}
          {saved && (
            <p className="text-xs text-status-success bg-status-success/10 border border-status-success/30 rounded-[10px] p-2.5">
              Payment gateway settings saved.
            </p>
          )}

          {[
            { key: 'razorpay_enabled' as const, label: 'Razorpay (UPI / NetBanking / Cards)', hint: 'Primary online payment provider' },
            { key: 'cod_enabled' as const, label: 'Cash on Delivery', hint: 'Pay the rider on arrival' },
            { key: 'wallet_enabled' as const, label: 'Wallet', hint: 'Pay from the customer\'s in-app wallet balance' },
          ].map(({ key, label, hint }) => (
            <label key={key} className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-[12px] border border-border cursor-pointer">
              <div>
                <p className="font-bold text-ink text-xs">{label}</p>
                <p className="text-[11px] text-status-neutral">{hint}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={form[key] ? 'success' : 'neutral'} size="sm">{form[key] ? 'Active' : 'Off'}</Badge>
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
              </div>
            </label>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className={labelClass}>COD Min Order Amount (₹)</label>
              <input type="number" className={inputClass} value={form.cod_min_order_amount} onChange={(e) => setForm({ ...form, cod_min_order_amount: e.target.value })} placeholder="No minimum" />
            </div>
            <div>
              <label className={labelClass}>COD Max Order Amount (₹)</label>
              <input type="number" className={inputClass} value={form.cod_max_amount} onChange={(e) => setForm({ ...form, cod_max_amount: e.target.value })} placeholder="No cap" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
