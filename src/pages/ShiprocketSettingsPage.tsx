import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  getShiprocketSettings,
  saveShiprocketSettings,
  testShiprocketConnection,
  type ShiprocketTestResult,
} from '../services/shiprocketSettingsService';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20';
const QUERY_KEY = ['admin', 'shiprocket-settings'];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

/**
 * Shiprocket API-user credentials (created in Shiprocket → Settings → API
 * Users). The password is encrypted server-side and never sent back.
 */
export default function ShiprocketSettingsPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pickup, setPickup] = useState<string | null>(null);
  const [result, setResult] = useState<ShiprocketTestResult | null>(null);

  const { data: settings, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: getShiprocketSettings });

  const save = useMutation({
    mutationFn: saveShiprocketSettings,
    onSuccess: (s) => {
      qc.setQueryData(QUERY_KEY, s);
      setPassword('');
      setEmail('');
      setResult(null);
      toast.success('Shiprocket settings saved');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const test = useMutation({
    mutationFn: testShiprocketConnection,
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      r.success ? toast.success('Connected to Shiprocket') : toast.error(r.message);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const draftReady = email.trim() !== '' && password !== '';
  const pickupValue = pickup ?? settings?.pickupLocation ?? '';

  const handleSave = () => {
    save.mutate({
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(password ? { password } : {}),
      ...(pickup !== null ? { pickupLocation: pickup.trim() } : {}),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shiprocket"
        subtitle="API user credentials for Shiprocket Quick deliveries"
        badge={
          settings?.lastTestStatus ? (
            <Badge variant={settings.lastTestStatus === 'SUCCESS' ? 'success' : 'danger'}>
              {settings.lastTestStatus === 'SUCCESS' ? 'Connected' : 'Last test failed'}
            </Badge>
          ) : undefined
        }
      />

      <Card className="p-5 space-y-4 max-w-2xl">
        {isLoading ? (
          <p className="text-sm text-status-neutral">Loading…</p>
        ) : (
          <>
            <p className="text-xs text-status-neutral">
              Use the API user created in Shiprocket (Settings → API Users), not your main login.
              {settings?.configured && (
                <> Saved: <b>{settings.email}</b> (password stored encrypted).</>
              )}
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">API user email</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={settings?.email ?? 'api-user@example.com'} autoComplete="off" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">API user password</label>
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={settings?.hasPassword ? '•••••••• (saved — type to replace)' : 'Password'} autoComplete="new-password" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Default pickup location name</label>
              <input className={inputClass} value={pickupValue} onChange={(e) => setPickup(e.target.value)}
                placeholder="Exactly as shown in Shiprocket, e.g. Kolkata" />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" disabled={test.isPending || (!draftReady && !settings?.configured)}
                onClick={() => test.mutate(draftReady ? { email: email.trim(), password } : {})}>
                {test.isPending ? 'Testing…' : draftReady ? 'Test these credentials' : 'Test saved credentials'}
              </Button>
              <Button disabled={save.isPending || (!draftReady && pickup === null)} onClick={handleSave}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
            {(email.trim() !== '') !== (password !== '') && (
              <p className="text-[11px] text-status-warning">Enter both email and password to test or replace credentials.</p>
            )}

            {result && (
              <div className={`rounded-lg border p-3 text-sm ${result.success ? 'border-status-success/40' : 'border-status-danger/40'}`}>
                <p className="font-bold">{result.message}</p>
                {result.pickupLocations && result.pickupLocations.length > 0 && (
                  <ul className="mt-2 text-xs space-y-1">
                    {result.pickupLocations.map((p) => (
                      <li key={p.name}>
                        <button type="button" className="underline" onClick={() => setPickup(p.name)}>{p.name}</button>
                        {' '}— {p.city} {p.pin}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
