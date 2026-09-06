import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Palette } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { appSettingsService } from '../../services/appSettingsService';

const inputClass =
  'w-full px-3 py-2 text-xs rounded-[10px] border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-raspberry/30 focus:border-brand-raspberry/50';
const labelClass = 'block text-[11px] font-bold text-ink mb-1';

// New app-settings keys this panel introduces, plus the one existing key
// (`store_name`) it reuses and relabels — all live in the same generic
// `app_settings` table, no backend changes needed.
const BRANDING_KEYS = ['store_name', 'logo_url', 'splash_image_url', 'primary_color', 'secondary_color', 'favicon_url'] as const;
type BrandingKey = typeof BRANDING_KEYS[number];

const emptyForm: Record<BrandingKey, string> = {
  store_name: '',
  logo_url: '',
  splash_image_url: '',
  primary_color: '#D6154C',
  secondary_color: '#7A0E33',
  favicon_url: '',
};

const QUERY_KEY = ['app-settings'] as const;

export const AppBrandingPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: appSettingsService.getAll,
  });

  useEffect(() => {
    if (!settings) return;
    setForm((prev) => {
      const next = { ...prev };
      BRANDING_KEYS.forEach((key) => {
        if (settings[key]?.value != null) next[key] = String(settings[key].value);
      });
      return next;
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<BrandingKey, string>) => appSettingsService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = () => {
    // Only send the branding keys this panel owns — a partial PUT payload,
    // so unrelated settings (app_maintenance, cod_enabled, rider pay, etc.)
    // are never touched.
    saveMutation.mutate(form);
  };

  return (
    <Card
      title="App Branding"
      subtitle="Logo, splash screen, and brand colors — shared with the mobile app via the same settings store."
      action={
        <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={handleSave} isLoading={saveMutation.isPending}>
          Save Branding
        </Button>
      }
    >
      {error ? (
        <p className="text-xs text-status-danger p-3">Failed to load settings: {(error as Error).message}</p>
      ) : isLoading ? (
        <p className="text-xs text-status-neutral p-3">Loading settings…</p>
      ) : (
        <div className="space-y-4">
          {saveMutation.error && (
            <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-[10px] p-2.5">
              {(saveMutation.error as Error).message}
            </p>
          )}
          {saved && (
            <p className="text-xs text-status-success bg-status-success/10 border border-status-success/30 rounded-[10px] p-2.5">
              Branding saved.
            </p>
          )}

          <div>
            <label className={labelClass}>App Name</label>
            <input className={inputClass} value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Logo URL</label>
              <input className={inputClass} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Favicon URL</label>
              <input className={inputClass} value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Splash Screen Image URL</label>
            <input className={inputClass} value={form.splash_image_url} onChange={(e) => setForm({ ...form, splash_image_url: e.target.value })} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Primary Color</label>
              <input type="color" className={`${inputClass} h-9 p-1`} value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Secondary Color</label>
              <input type="color" className={`${inputClass} h-9 p-1`} value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-[10px] border border-border bg-rose-50/50">
            <Palette className="w-4 h-4 text-status-neutral shrink-0" />
            <div className="flex gap-2">
              <span className="w-8 h-8 rounded-[8px] border border-border" style={{ backgroundColor: form.primary_color }} title="Primary" />
              <span className="w-8 h-8 rounded-[8px] border border-border" style={{ backgroundColor: form.secondary_color }} title="Secondary" />
            </div>
            <p className="text-[11px] text-status-neutral">Live preview of the selected brand colors.</p>
          </div>
        </div>
      )}
    </Card>
  );
};
