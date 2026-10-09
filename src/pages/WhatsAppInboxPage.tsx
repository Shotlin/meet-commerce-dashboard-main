import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { ArrowLeft, FileText, Loader2, Paperclip, Search, Send, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '../services/apiClient';
import { sessionManager } from '../services/sessionManager';
import {
  whatsappService,
  type WhatsAppChatMessage,
  type WhatsAppConversation,
} from '../services/whatsappService';

const MAX_FILE_BYTES = 16 * 1024 * 1024;
const CONV_KEY = ['admin', 'whatsapp', 'inbox', 'conversations'];
const threadKey = (id: string) => ['admin', 'whatsapp', 'inbox', 'thread', id];
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

const nameOf = (c: WhatsAppConversation) => c.display_name || (c.phone ? `+${c.phone}` : 'WhatsApp user');
const phoneOf = (c: WhatsAppConversation) => (c.phone ? `+${c.phone.slice(0, c.phone.length - 10)} ${c.phone.slice(-10)}` : '');
const initials = (c: WhatsAppConversation) =>
  (c.display_name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '#';
const formatSize = (n: number | null) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : '');

function shortTime(iso: string) {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return d.format('h:mm a');
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('D MMM');
}
function dayLabel(iso: string) {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('D MMM YYYY');
}

/** Fetches a protected file with the admin token and exposes it as an object URL. */
function useMediaUrl(messageId: string, enabled: boolean) {
  const [state, setState] = useState<{ url: string | null; error: boolean }>({ url: null, error: false });
  useEffect(() => {
    if (!enabled) return;
    let revoked = false;
    let objectUrl: string | null = null;
    whatsappService
      .mediaBlob(messageId)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, error: false });
      })
      .catch(() => !revoked && setState({ url: null, error: true }));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [messageId, enabled]);
  return state;
}

/** Live push from the server; the list/thread also poll, so this only makes it instant. */
function useWhatsAppLive(onMessage: (conversationId?: string) => void) {
  const cb = useRef(onMessage);
  cb.current = onMessage;
  useEffect(() => {
    const token = sessionManager.getToken();
    if (!token) return;
    const socket = io(apiClient.getBaseUrl(), { auth: { token }, transports: ['websocket'] });
    socket.on('whatsapp:message', (p: { conversationId?: string }) => cb.current(p?.conversationId));
    socket.on('connect', () => cb.current());
    return () => { socket.disconnect(); };
  }, []);
}

export default function WhatsAppInboxPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: list, isLoading } = useQuery({
    queryKey: [...CONV_KEY, debounced, unreadOnly],
    queryFn: () => whatsappService.conversations({ search: debounced, unread: unreadOnly }),
    refetchInterval: 8000,
  });

  useWhatsAppLive((conversationId) => {
    qc.invalidateQueries({ queryKey: CONV_KEY });
    if (conversationId) qc.invalidateQueries({ queryKey: threadKey(conversationId) });
  });

  const active = list?.conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[480px]">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight">WhatsApp Inbox</h1>
          <p className="text-xs md:text-sm text-status-neutral">
            Replies from customers land here.{' '}
            {list && <>Chats are kept <b>{list.retentionDays} days</b> after their last message. </>}
            <Link to="/whatsapp" className="underline">Settings</Link>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid md:grid-cols-[340px_1fr] rounded-xl border border-border bg-white overflow-hidden">
        {/* ── conversation list ── */}
        <aside className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col min-h-0 border-r border-border`}>
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number" className="pl-9" />
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant={unreadOnly ? 'outline' : 'secondary'} onClick={() => setUnreadOnly(false)}>All</Button>
              <Button size="sm" variant={unreadOnly ? 'secondary' : 'outline'} onClick={() => setUnreadOnly(true)}>
                Unread{list && list.unreadTotal > 0 ? ` (${list.unreadTotal})` : ''}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="p-3 space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !list?.conversations.length ? (
              <p className="p-6 text-sm text-status-neutral text-center">
                {debounced || unreadOnly ? 'No matching chats.' : 'No chats yet. When a customer messages your WhatsApp number, it appears here.'}
              </p>
            ) : (
              list.conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-3 flex gap-3 items-start border-b border-border/60 cursor-pointer hover:bg-muted/50 ${c.id === activeId ? 'bg-muted' : ''}`}
                >
                  <Avatar className="h-10 w-10 shrink-0"><AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{initials(c)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${c.unread_count ? 'font-extrabold' : 'font-semibold'} text-ink`}>{nameOf(c)}</p>
                      <span className="text-[11px] text-status-neutral shrink-0">{shortTime(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-status-neutral">
                        {c.last_direction === 'OUT' ? 'You: ' : ''}{c.last_message_preview}
                      </p>
                      {c.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-600">{c.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── thread ── */}
        <section className={`${activeId ? 'flex' : 'hidden md:flex'} flex-col min-h-0 min-w-0`}>
          {active ? (
            <Thread key={active.id} conversation={active} onBack={() => setActiveId(null)} onDeleted={() => setActiveId(null)} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-status-neutral p-6 text-center">
              Select a chat to read and reply.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({ conversation, onBack, onDeleted }: { conversation: WhatsAppConversation; onBack: () => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const id = conversation.id;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Newest page first; "Load earlier" fetches the page before the oldest loaded message.
  const thread = useInfiniteQuery({
    queryKey: threadKey(id),
    queryFn: ({ pageParam }) => whatsappService.thread(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.messages.length >= 100 ? last.messages[0].created_at : undefined),
    refetchInterval: 8000,
  });

  const messages = useMemo<WhatsAppChatMessage[]>(() => {
    const pages = thread.data?.pages ?? [];
    // pages[0] = newest page; later pages are older. Merge oldest → newest without duplicates.
    const seen = new Set<string>();
    const out: WhatsAppChatMessage[] = [];
    for (let i = pages.length - 1; i >= 0; i--) for (const m of pages[i].messages) if (!seen.has(m.id)) { seen.add(m.id); out.push(m); }
    return out.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [thread.data]);

  // Opening a chat (and every new incoming message while it is open) marks it read.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!lastId) return;
    whatsappService.markRead(id).then(() => qc.invalidateQueries({ queryKey: CONV_KEY })).catch(() => {});
  }, [id, lastId, qc]);

  // Scroll: jump to the bottom on open and on new messages, but never yank the
  // view while the agent is reading older messages.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevHeight.current !== null) {
      // Older messages were just prepended: keep the reader on the same message.
      el.scrollTop = el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastId, progress, messages.length]);

  const sendText = useMutation({
    mutationFn: (t: string) => whatsappService.sendText(id, t),
    onSuccess: () => { stickToBottom.current = true; qc.invalidateQueries({ queryKey: threadKey(id) }); qc.invalidateQueries({ queryKey: CONV_KEY }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const sendFile = useMutation({
    mutationFn: ({ f, caption }: { f: File; caption: string }) => whatsappService.sendFile(id, f, caption, setProgress),
    onSuccess: () => {
      stickToBottom.current = true;
      setFile(null); setText('');
      qc.invalidateQueries({ queryKey: threadKey(id) }); qc.invalidateQueries({ queryKey: CONV_KEY });
    },
    onError: (e) => toast.error(errMsg(e)),
    onSettled: () => setProgress(null),
  });
  const remove = useMutation({
    mutationFn: () => whatsappService.deleteConversation(id),
    onSuccess: () => { toast.success('Chat deleted'); qc.invalidateQueries({ queryKey: CONV_KEY }); onDeleted(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const busy = sendText.isPending || sendFile.isPending;
  const submit = () => {
    if (busy) return;
    if (file) sendFile.mutate({ f: file, caption: text });
    else if (text.trim()) { sendText.mutate(text.trim()); setText(''); }
  };
  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) { toast.error('File is too large (max 16 MB)'); return; }
    setFile(f);
  };

  let lastDay = '';
  return (
    <>
      <header className="flex items-center gap-3 px-3 py-2.5 border-b border-border">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back"><ArrowLeft className="w-4 h-4" /></Button>
        <Avatar className="h-9 w-9"><AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{initials(conversation)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink truncate">{nameOf(conversation)}</p>
          <p className="text-xs text-status-neutral truncate">{phoneOf(conversation)} · kept until {dayjs(conversation.expires_at).format('D MMM, h:mm a')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete chat"><Trash2 className="w-4 h-4 text-red-600" /></Button>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-4 space-y-1.5">
        {thread.hasNextPage && (
          <div className="flex justify-center pb-2">
            <Button size="sm" variant="outline" disabled={thread.isFetchingNextPage} onClick={() => { stickToBottom.current = false; prevHeight.current = scrollRef.current?.scrollHeight ?? null; thread.fetchNextPage(); }}>
              {thread.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
            </Button>
          </div>
        )}
        {thread.isLoading && <Skeleton className="h-12 w-2/3" />}
        {messages.map((m) => {
          const label = dayLabel(m.created_at);
          const showDay = label !== lastDay;
          lastDay = label;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-3"><span className="text-[11px] bg-white border border-border rounded-full px-3 py-0.5 text-status-neutral">{label}</span></div>
              )}
              <Bubble m={m} />
            </div>
          );
        })}
        {progress !== null && (
          <div className="flex justify-end"><div className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending file… {progress}%</div></div>
        )}
      </div>

      <footer className="border-t border-border p-3 space-y-2 bg-white">
        {file && (
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <FileText className="w-4 h-4 text-status-neutral shrink-0" />
            <span className="truncate flex-1">{file.name}</span>
            <span className="text-xs text-status-neutral">{formatSize(file.size)}</span>
            <button onClick={() => setFile(null)} aria-label="Remove file" className="cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
          <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} aria-label="Attach file" disabled={busy}><Paperclip className="w-4 h-4" /></Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={file ? 'Add a caption (optional)…' : 'Type a reply…'}
            rows={1}
            maxLength={4000}
            className="min-h-10 max-h-36 resize-none"
          />
          <Button onClick={submit} disabled={busy || (!file && !text.trim())} aria-label="Send">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </footer>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>All messages and files in this chat are removed now. This does not affect the customer's WhatsApp.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Bubble({ m }: { m: WhatsAppChatMessage }) {
  const out = m.direction === 'OUT';
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${out ? 'bg-emerald-100 rounded-br-sm' : 'bg-white border border-border rounded-bl-sm'}`}>
        {m.source === 'AUTOMATED' && <p className="text-[10px] font-bold tracking-wide text-emerald-700 mb-0.5">AUTOMATIC MESSAGE</p>}
        {m.has_media && <Media m={m} />}
        {m.body && !(m.type === 'document' && m.body === m.media_name) && (
          <p className="text-[13.5px] text-ink whitespace-pre-wrap break-words">{m.body}</p>
        )}
        <p className="text-[10px] text-status-neutral text-right mt-0.5">{dayjs(m.created_at).format('h:mm a')}</p>
      </div>
    </div>
  );
}

function Media({ m }: { m: WhatsAppChatMessage }) {
  const inline = m.type === 'image' || m.type === 'sticker' || m.type === 'video' || m.type === 'audio';
  const { url, error } = useMediaUrl(m.id, inline);
  const [downloading, setDownloading] = useState(false);

  if (inline) {
    if (error) return <p className="text-xs text-status-neutral italic">File no longer available</p>;
    if (!url) return <Skeleton className="h-40 w-56 mb-1" />;
    if (m.type === 'video') return <video src={url} controls className="rounded-lg max-h-72 mb-1" />;
    if (m.type === 'audio') return <audio src={url} controls className="mb-1 max-w-full" />;
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={m.media_name || 'image'} className="rounded-lg max-h-72 mb-1 object-contain" />
      </a>
    );
  }

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await whatsappService.mediaBlob(m.id);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = m.media_name || 'file';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button onClick={download} className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 mb-1 text-left cursor-pointer w-full">
      {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 shrink-0" />}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink truncate">{m.media_name || 'File'}</span>
        <span className="block text-[11px] text-status-neutral">{formatSize(m.media_size)} · tap to download</span>
      </span>
    </button>
  );
}
