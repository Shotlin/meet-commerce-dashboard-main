import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, LifeBuoy } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { supportSettingsService } from '../../services/supportSettingsService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

interface SupportSettingsForm {
  brandName: string;
  supportPhone: string;
  supportEmail: string;
}

const emptyForm: SupportSettingsForm = { brandName: '', supportPhone: '', supportEmail: '' };

const QUERY_KEY = ['support-settings'] as const;

/**
 * Brand name / support phone / support email — the single source every
 * mobile "Need Help" (Order Details) and "Contact Us" (Profile) bottom
 * sheet reads from. A save here takes effect on the mobile app within its
 * own cache window (a few minutes) — no app update needed.
 */
export const SupportSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: supportSettingsService.get,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      brandName: settings.brandName ?? '',
      supportPhone: settings.supportPhone ?? '',
      supportEmail: settings.supportEmail ?? '',
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => supportSettingsService.save({
      brandName: form.brandName,
      supportPhone: form.supportPhone,
      supportEmail: form.supportEmail,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card
      title="Support & Contact Settings"
      subtitle="Brand name, helpline number, and support email — the single source every mobile Need Help / Contact Us screen reads from."
      action={
        <div className="flex items-center gap-2">
          <Badge variant="brand" icon={<LifeBuoy className="w-3 h-3" />}>Live on mobile</Badge>
          <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
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
              Support settings saved — live on the mobile app now.
            </p>
          )}

          <div>
            <label className={labelClass}>Brand Name</label>
            <input className={inputClass} value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="FreshCuts" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Helpline / Support Phone</label>
              <input className={inputClass} value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} placeholder="+91 99249 98906" />
              <p className="mt-1 text-[10px] text-status-neutral">Leave blank to hide the Call option in the app.</p>
            </div>
            <div>
              <label className={labelClass}>Support Email</label>
              <input type="email" className={inputClass} value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@freshcuts.in" />
              <p className="mt-1 text-[10px] text-status-neutral">Leave blank to hide the Email option in the app.</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
