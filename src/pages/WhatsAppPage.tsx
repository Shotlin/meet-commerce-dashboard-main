import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle, Plus, Trash2, Smartphone, ShieldCheck, RotateCcw, Send } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Tabs } from '../components/common/Tabs';
import { Switch } from '@/components/ui/switch';
import {
  whatsappService,
  type WhatsAppEvent,
  type WhatsAppSettings,
  type WhatsAppConnection,
  type WhatsAppOverview,
} from '../services/whatsappService';

const OVERVIEW_KEY = ['admin', 'whatsapp', 'overview'];
const EVENTS_KEY = ['admin', 'whatsapp', 'events'];
const inputClass =
  'w-full h-10 px-3 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20';
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const formatPhone = (p: string | null) => (p ? `+${p.slice(0, p.length - 10)} ${p.slice(-10, -5)} ${p.slice(-5)}` : '—');
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const STATE_LABEL: Record<WhatsAppConnection['state'], { text: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  CONNECTED: { text: 'Connected', variant: 'success' },
  CONNECTING: { text: 'Connecting…', variant: 'info' },
  QR: { text: 'Waiting for scan', variant: 'warning' },
  DISCONNECTED: { text: 'Not connected', variant: 'neutral' },
  LOGGED_OUT: { text: 'Unlinked from phone', variant: 'danger' },
  ERROR: { text: 'Problem', variant: 'danger' },
};

export default function WhatsAppPage() {
  const [tab, setTab] = useState('connection');

  const { data: overview, isLoading } = useQuery({
    queryKey: OVERVIEW_KEY,
    queryFn: whatsappService.overview,
    // Poll fast while the QR is on screen so it refreshes and the success state appears instantly.
    refetchInterval: (q) => {
      const s = q.state.data?.connection.state;
      return s === 'QR' || s === 'CONNECTING' ? 2000 : 15000;
    },
  });

  const state = overview?.connection.state ?? 'DISCONNECTED';
  const badge = STATE_LABEL[state];

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp"
        subtitle="Send order confirmations and updates to customers from your own WhatsApp number"
        badge={<Badge variant={badge.variant}>{badge.text}</Badge>}
      />
      <Tabs
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'connection', label: 'Connection' },
          { id: 'messages', label: 'Messages' },
          { id: 'limits', label: 'Limits & safety' },
          { id: 'log', label: 'Sent log' },
        ]}
      />
      {isLoading || !overview ? (
        <p className="text-sm text-status-neutral">Loading…</p>
      ) : (
        <>
          {tab === 'connection' && <ConnectionPanel overview={overview} />}
          {tab === 'messages' && <MessagesPanel />}
          {tab === 'limits' && <LimitsPanel settings={overview.settings} />}
          {tab === 'log' && <LogPanel />}
        </>
      )}
    </div>
  );
}

// ─── Connection ──────────────────────────────────────────────────────────────

function ConnectionPanel({ overview }: { overview: WhatsAppOverview }) {
  const qc = useQueryClient();
  const { connection, settings, stats } = overview;
  const refresh = () => qc.invalidateQueries({ queryKey: OVERVIEW_KEY });

  const connect = useMutation({ mutationFn: whatsappService.connect, onSuccess: refresh, onError: (e) => toast.error(errMsg(e)) });
  const disconnect = useMutation({
    mutationFn: whatsappService.disconnect,
    onSuccess: () => { toast.success('Disconnected. Your link is kept — reconnect any time without scanning.'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const logout = useMutation({
    mutationFn: whatsappService.logout,
    onSuccess: () => { toast.success('Number unlinked'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => whatsappService.saveSettings({ enabled }),
    onSuccess: (_, enabled) => { toast.success(enabled ? 'Order messages are ON' : 'Order messages are OFF'); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5 space-y-4">
        {connection.connected ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">WhatsApp connected</p>
                <p className="text-lg font-extrabold text-ink font-mono-num">{formatPhone(connection.phone)}</p>
                {connection.name && <p className="text-xs text-status-neutral">{connection.name}</p>}
              </div>
            </div>
            {settings.firstConnectedAt && (
              <p className="text-xs text-status-neutral">
                Linked since {new Date(settings.firstConnectedAt).toLocaleDateString()}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                Disconnect
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={logout.isPending}
                onClick={() => window.confirm('Unlink this number? You will need to scan a new QR code to use WhatsApp again.') && logout.mutate()}
              >
                Unlink number
              </Button>
            </div>
          </>
        ) : connection.state === 'QR' && connection.qr ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Scan with the WhatsApp you want to send from</p>
            <img src={connection.qr} alt="WhatsApp QR code" className="w-64 h-64 border border-border rounded-lg" />
            <ol className="text-xs text-status-neutral list-decimal pl-4 space-y-0.5">
              <li>Open WhatsApp on that phone</li>
              <li>Settings → Linked devices → Link a device</li>
              <li>Point the camera at this code</li>
            </ol>
            <p className="text-[11px] text-status-neutral">The code refreshes by itself. Use a dedicated business number, not a personal one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-ink-2" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">No WhatsApp number linked</p>
                <p className="text-xs text-status-neutral">Link a number to start sending order messages.</p>
              </div>
            </div>
            {connection.lastError && <p className="text-xs text-red-600">{connection.lastError}</p>}
            <Button onClick={() => connect.mutate()} disabled={connect.isPending || connection.state === 'CONNECTING'}>
              {connection.state === 'CONNECTING' ? 'Starting…' : 'Connect WhatsApp'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Send order messages</p>
            <p className="text-xs text-status-neutral">
              Master switch. When on, customers get the messages you turned on in the <b>Messages</b> tab.
            </p>
          </div>
          <Switch checked={settings.enabled} disabled={toggle.isPending} onCheckedChange={(v) => toggle.mutate(v)} aria-label="Send order messages" />
        </div>
        {settings.enabled && !connection.connected && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
            Messages are queued until the number is connected (they expire after 6 hours).
          </p>
        )}
        {overview.autoPausedUntil && (
          <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2.5">
            Sending was paused automatically after repeated failures. It resumes at {new Date(overview.autoPausedUntil).toLocaleTimeString()}.
          </p>
        )}
        {overview.quietNow && settings.enabled && (
          <p className="text-xs text-status-neutral bg-muted rounded-lg p-2.5">Quiet hours — messages are held until they end.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Sent (1h)', stats.sent_1h],
            ['Sent (24h)', `${stats.sent_24h}/${overview.effectiveDailyCap}`],
            ['Waiting', stats.queued],
            ['Failed (24h)', stats.failed_24h],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-muted p-2.5">
              <p className="text-[11px] text-status-neutral">{label}</p>
              <p className="text-base font-extrabold text-ink font-mono-num">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-xs text-status-neutral">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <p>
            This uses an unofficial WhatsApp connection. Messages are paced like a person, varied each time, and capped, which lowers — but cannot remove — the risk of the number being restricted.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Messages (events + variants) ────────────────────────────────────────────

function MessagesPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: EVENTS_KEY, queryFn: whatsappService.events });
  const [selectedKey, setSelectedKey] = useState<string>('ORDER_PLACED');
  const selected = data?.events.find((e) => e.key === selectedKey) ?? data?.events[0];

  if (!data || !selected) return <p className="text-sm text-status-neutral">Loading…</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card padding="sm" className="space-y-1 h-fit">
        {data.events.map((e) => (
          <button
            key={e.key}
            onClick={() => setSelectedKey(e.key)}
            className={`w-full text-left rounded-lg px-3 py-2 flex items-center justify-between gap-2 cursor-pointer ${
              e.key === selected.key ? 'bg-muted' : 'hover:bg-muted/60'
            }`}
          >
            <span className="text-sm font-semibold text-ink">{e.label}</span>
            <Badge variant={e.enabled ? 'success' : 'neutral'}>{e.enabled ? 'On' : 'Off'}</Badge>
          </button>
        ))}
      </Card>
      <EventEditor
        key={selected.key}
        event={selected}
        variables={data.variables}
        onSaved={() => qc.invalidateQueries({ queryKey: EVENTS_KEY })}
      />
    </div>
  );
}

function EventEditor({
  event,
  variables,
  onSaved,
}: {
  event: WhatsAppEvent;
  variables: { key: string; desc: string }[];
  onSaved: () => void;
}) {
  const [enabled, setEnabled] = useState(event.enabled);
  const [variants, setVariants] = useState<string[]>(event.variants);
  const [samples, setSamples] = useState<string[]>([]);
  const [testPhone, setTestPhone] = useState('');
  useEffect(() => { setEnabled(event.enabled); setVariants(event.variants); setSamples([]); }, [event]);

  const dirty = useMemo(
    () => enabled !== event.enabled || JSON.stringify(variants) !== JSON.stringify(event.variants),
    [enabled, variants, event]
  );

  const save = useMutation({
    mutationFn: () => whatsappService.saveEvent(event.key, { enabled, variants }),
    onSuccess: () => { toast.success('Saved'); onSaved(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const reset = useMutation({
    mutationFn: () => whatsappService.resetEvent(event.key),
    onSuccess: () => { toast.success('Back to default messages'); onSaved(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const preview = useMutation({
    mutationFn: () => whatsappService.preview(event.key, variants, 5),
    onSuccess: (r) => setSamples(r.messages),
    onError: (e) => toast.error(errMsg(e)),
  });
  const test = useMutation({
    mutationFn: () => whatsappService.sendTest({ phone: testPhone, eventKey: event.key, variants }),
    onSuccess: () => toast.success('Test queued — it is sent with the normal short delay'),
    onError: (e) => toast.error(errMsg(e)),
  });

  const setVariant = (i: number, v: string) => setVariants((vs) => vs.map((x, n) => (n === i ? v : x)));

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">{event.label}</p>
          <p className="text-xs text-status-neutral">{event.hint}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={`Send ${event.label}`} />
      </div>

      <div className="rounded-lg bg-muted p-3 text-xs text-ink-2 space-y-1">
        <p>
          <b>Make every message different:</b> write <code className="font-mono">{'{Hi|Hello|Hey}'}</code> and one option is picked each time. Add several message versions below — a different one is used for each customer.
        </p>
        <p>
          Variables:{' '}
          {variables.map((v) => (
            <code key={v.key} title={v.desc} className="font-mono mr-1.5">{`{{${v.key}}}`}</code>
          ))}
        </p>
        <p className="text-status-neutral">≈ {event.combinations.toLocaleString()} different texts possible with the current versions.</p>
      </div>

      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={v}
              onChange={(e) => setVariant(i, e.target.value)}
              rows={5}
              maxLength={1000}
              className="flex-1 rounded-lg border border-border bg-white p-3 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-ink/20"
              aria-label={`Message version ${i + 1}`}
            />
            <button
              className="self-start p-2 text-status-neutral hover:text-red-600 cursor-pointer disabled:opacity-30"
              disabled={variants.length <= 1}
              onClick={() => setVariants((vs) => vs.filter((_, n) => n !== i))}
              aria-label="Remove version"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {variants.length < 12 && (
          <Button variant="outline" size="sm" onClick={() => setVariants((vs) => [...vs, '{Hi|Hello} {{firstName}}, '])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add another version
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>Save</Button>
        <Button variant="outline" onClick={() => preview.mutate()} disabled={preview.isPending}>Preview 5 samples</Button>
        {event.customized && (
          <Button variant="ghost" onClick={() => window.confirm('Replace your versions with the built-in ones?') && reset.mutate()}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset to default
          </Button>
        )}
      </div>

      {samples.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {samples.map((s, i) => (
            <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-[13px] text-ink whitespace-pre-wrap">
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
        <input
          className={inputClass}
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          placeholder="Send a test to this mobile number"
          inputMode="tel"
        />
        <Button variant="outline" onClick={() => test.mutate()} disabled={!testPhone.trim() || test.isPending}>
          <Send className="w-3.5 h-3.5 mr-1" /> Send test
        </Button>
      </div>
    </Card>
  );
}

// ─── Limits & safety ─────────────────────────────────────────────────────────

function LimitsPanel({ settings }: { settings: WhatsAppSettings }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<WhatsAppSettings>(settings);
  useEffect(() => setDraft(settings), [settings]);
  const set = <K extends keyof WhatsAppSettings>(k: K, v: WhatsAppSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const num = (k: keyof WhatsAppSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  const save = useMutation({
    mutationFn: () => {
      const { connectedPhone, connectedName, firstConnectedAt, lastConnectedAt, ...patch } = draft;
      void connectedPhone; void connectedName; void firstConnectedAt; void lastConnectedAt;
      return whatsappService.saveSettings(patch);
    },
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: OVERVIEW_KEY }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const field = (label: string, hint: string, control: React.ReactNode) => (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-ink">{label}</span>
      {control}
      <span className="block text-[11px] text-status-neutral">{hint}</span>
    </label>
  );

  return (
    <Card className="p-5 space-y-5 max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('Wait before sending (min, seconds)', 'Each message is held a random time after the order so it never lands instantly.',
          <input type="number" className={inputClass} value={draft.sendDelayMinSec} onChange={num('sendDelayMinSec')} />)}
        {field('Wait before sending (max, seconds)', 'Upper end of that random wait.',
          <input type="number" className={inputClass} value={draft.sendDelayMaxSec} onChange={num('sendDelayMaxSec')} />)}
        {field('Gap between messages (min, seconds)', 'Minimum pause between two messages going out.',
          <input type="number" className={inputClass} value={draft.minGapSec} onChange={num('minGapSec')} />)}
        {field('Gap between messages (max, seconds)', 'The gap is random between min and max.',
          <input type="number" className={inputClass} value={draft.maxGapSec} onChange={num('maxGapSec')} />)}
        {field('Per-hour limit', 'Hard ceiling of messages in any hour.',
          <input type="number" className={inputClass} value={draft.hourlyCap} onChange={num('hourlyCap')} />)}
        {field('Per-day limit', 'Hard ceiling in any 24 hours (warm-up can lower it for a new number).',
          <input type="number" className={inputClass} value={draft.dailyCap} onChange={num('dailyCap')} />)}
        {field('Country code', 'Added to 10-digit mobile numbers. India = 91.',
          <input className={inputClass} value={draft.countryCode} onChange={(e) => set('countryCode', e.target.value.replace(/\D/g, ''))} />)}
      </div>

      <div className="rounded-lg border border-border p-3 space-y-2">
        <p className="text-sm font-semibold text-ink">Keep chats in the inbox for</p>
        <p className="text-xs text-status-neutral">
          A chat is deleted this many days after its <b>last</b> message (sent or received). A new message starts the count again, so active chats are never removed.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 3, 7, 15, 30].map((d) => (
            <Button key={d} size="sm" variant={draft.chatRetentionDays === d ? 'primary' : 'outline'} onClick={() => set('chatRetentionDays', d)}>
              {d} {d === 1 ? 'day' : 'days'}
            </Button>
          ))}
          <input
            type="number" min={1} max={90} className={`${inputClass} w-24`}
            value={draft.chatRetentionDays}
            onChange={(e) => set('chatRetentionDays', Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
            aria-label="Custom number of days"
          />
        </div>
      </div>

      <div className="space-y-3">
        {[
          ['typingSimulation', 'Show "typing…" before each message', 'Mimics a person typing; adds a few seconds per message.'],
          ['warmupEnabled', 'Warm-up for a new number', 'Starts at 20 messages/day and grows over the first week. Strongly recommended.'],
          ['quietHoursEnabled', 'Quiet hours', 'Hold messages overnight (India time) and send them after.'],
        ].map(([key, label, hint]) => (
          <div key={key} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-status-neutral">{hint}</p>
            </div>
            <Switch checked={draft[key as keyof WhatsAppSettings] as boolean} onCheckedChange={(v) => set(key as keyof WhatsAppSettings, v as never)} />
          </div>
        ))}
        {draft.quietHoursEnabled && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-status-neutral">From</span>
            <input type="time" className={`${inputClass} w-32`} value={minToTime(draft.quietStartMin)} onChange={(e) => set('quietStartMin', timeToMin(e.target.value))} />
            <span className="text-status-neutral">to</span>
            <input type="time" className={`${inputClass} w-32`} value={minToTime(draft.quietEndMin)} onChange={(e) => set('quietEndMin', timeToMin(e.target.value))} />
          </div>
        )}
      </div>

      <div className="rounded-lg bg-muted p-3 text-xs text-ink-2 space-y-1">
        <p className="font-bold">Always on, no setting needed</p>
        <p>• Only customers who just placed an order are messaged, and a number that isn't on WhatsApp is skipped.</p>
        <p>• A customer who replies <b>STOP</b> is never messaged again.</p>
        <p>• Sending pauses by itself for 30 minutes after repeated failures.</p>
        <p>• The delivery OTP is never sent on WhatsApp.</p>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>Save settings</Button>
    </Card>
  );
}

// ─── Sent log ────────────────────────────────────────────────────────────────

const STATUS_BADGE = { SENT: 'success', QUEUED: 'info', SENDING: 'info', FAILED: 'danger', SKIPPED: 'neutral' } as const;

function LogPanel() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'whatsapp', 'messages', status],
    queryFn: () => whatsappService.messages({ status: status || undefined, limit: 50 }),
    refetchInterval: 10000,
  });

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <select className={`${inputClass} w-44`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {['SENT', 'QUEUED', 'FAILED', 'SKIPPED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-status-neutral">{data ? `${data.total} messages` : ''}</span>
      </div>
      {isLoading ? <p className="text-sm text-status-neutral">Loading…</p> : !data?.rows.length ? (
        <p className="text-sm text-status-neutral">No messages yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {data.rows.map((m) => (
            <div key={m.id} className="py-3 grid gap-1 sm:grid-cols-[160px_1fr_110px] sm:gap-4">
              <div className="text-xs text-status-neutral">
                <p className="font-mono-num text-ink">{m.phone}</p>
                <p>{new Date(m.sent_at || m.created_at).toLocaleString()}</p>
                <p>{m.event_key}</p>
              </div>
              <p className="text-[13px] text-ink whitespace-pre-wrap">{m.body}</p>
              <div className="sm:text-right space-y-1">
                <Badge variant={STATUS_BADGE[m.status]}>{m.status}</Badge>
                {(m.skip_reason || m.error) && <p className="text-[11px] text-status-neutral break-words">{m.skip_reason || m.error}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
