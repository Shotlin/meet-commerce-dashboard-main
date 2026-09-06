import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { supportService, SupportTicket } from '../services/supportService';
import { useScope } from '../context/ScopeContext';
import { LifeBuoy, MessageSquare, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { setSupportTicketsCount, refreshGlobalCounts } = useScope();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Private Note Modal State
  const [noteModalTicket, setNoteModalTicket] = useState<SupportTicket | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Refund / Replacement Modal State
  const [refundModalTicket, setRefundModalTicket] = useState<SupportTicket | null>(null);
  const [refundType, setRefundType] = useState<'Refund' | 'Replacement'>('Refund');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await supportService.getTickets();
      setTickets(data);

      const openCount = data.filter((t) => t.status === 'Open' || t.status === 'Escalated' || t.status === 'In Progress').length;
      setSupportTicketsCount(openCount);
    } catch (err: any) {
      console.error('[SupportPage] API Error:', err);
      setError(err.message || 'Unable to fetch support tickets from API (http://localhost:4500)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrivateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalTicket || !noteInput.trim()) return;
    setIsSubmittingNote(true);
    try {
      const updated = await supportService.addPrivateNote(noteModalTicket.id, noteInput.trim());
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setFeedback({ type: 'success', text: `Private audit note saved to ticket ${updated.id}.` });
      setNoteModalTicket(null);
      setNoteInput('');
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'danger', text: err.message || 'Failed to submit private note.' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleProcessRefundOrReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalTicket) return;
    setIsSubmittingRefund(true);
    try {
      const updated = await supportService.processRefundOrReplacement(refundModalTicket.id, refundType);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      
      const openCount = tickets.filter((t) => (t.id === updated.id ? false : t.status === 'Open' || t.status === 'Escalated' || t.status === 'In Progress')).length;
      setSupportTicketsCount(openCount);
      refreshGlobalCounts().catch(() => {});

      setFeedback({
        type: 'success',
        text: `${refundType} processed successfully for ticket ${updated.id}. Status updated to RESOLVED.`,
      });
      setRefundModalTicket(null);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'danger', text: err.message || 'Failed to process refund/replacement action.' });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-berry animate-spin mx-auto" />
        <p className="text-xs font-bold text-ink">Connecting to Live Support Tickets API (/api/v1/support/tickets)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">Unable to Load Support Desk Data</h3>
        <p className="text-xs text-status-neutral">{error}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchTickets}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const openTicketsCount = tickets.filter((t) => t.status === 'Open' || t.status === 'Escalated' || t.status === 'In Progress').length;

  return (
    <div>
      <PageHeader
        title="Support Desk Inbox & Refunds"
        subtitle="Customer support tickets, order context panel, refund/replacement workflow, and private staff notes."
        badge={<Badge variant="brand" icon={<LifeBuoy className="w-3.5 h-3.5" />}>{openTicketsCount} Open Tickets</Badge>}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchTickets}>
            Refresh API Data
          </Button>
        }
      />

      {feedback && (
        <div
          className={`p-3.5 mb-4 rounded-[12px] border text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-4">
        {tickets.map((t) => (
          <Card
            key={t.id}
            title={`${t.id}: ${t.title || t.category}`}
            action={
              <Badge variant={t.status === 'Resolved' ? 'success' : t.status === 'Open' ? 'danger' : 'warning'}>
                {t.status}
              </Badge>
            }
          >
            <div className="space-y-2">
              <p className="text-xs text-status-neutral">
                Customer: <strong className="text-ink">{t.customerName}</strong> • Category: <strong className="text-ink">{t.category}</strong> • Linked Order: <span className="font-mono-num font-bold text-brand-berry">{t.orderNumber}</span>
              </p>

              {/* Staff Private Notes Log */}
              {t.notes && t.notes.length > 0 && (
                <div className="p-3 bg-rose-50 border border-border rounded-[12px] space-y-1 mt-2">
                  <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Staff Audit Notes ({t.notes.length}):</p>
                  {t.notes.map((n, idx) => (
                    <p key={idx} className="text-xs text-status-neutral italic">
                      • "{n}"
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<MessageSquare className="w-3.5 h-3.5" />}
                onClick={() => {
                  setNoteModalTicket(t);
                  setNoteInput('');
                }}
              >
                Private Note
              </Button>
              {t.status !== 'Resolved' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setRefundModalTicket(t);
                    setRefundType('Refund');
                  }}
                >
                  Process Replacement / Refund
                </Button>
              ) : (
                <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
                  {t.resolutionType || 'Resolved'} Completed
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Private Note Modal */}
      <Modal
        isOpen={!!noteModalTicket}
        onClose={() => setNoteModalTicket(null)}
        title={`Add Staff Note: Ticket ${noteModalTicket?.id}`}
        subtitle={`Customer: ${noteModalTicket?.customerName} • Order: ${noteModalTicket?.orderNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddPrivateNote} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-ink block mb-1">Internal Staff Audit Note:</label>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Enter note (e.g. Cold-chain temperature logger verified at 2.4°C. Seal intact)..."
              className="w-full p-2.5 bg-rose-50/50 border border-border rounded-[12px] focus:bg-white text-ink text-xs focus:outline-none focus:border-brand-raspberry h-24"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" type="button" onClick={() => setNoteModalTicket(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingNote}>
              {isSubmittingNote ? 'Saving Note...' : 'Save Private Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Process Refund / Replacement Modal */}
      <Modal
        isOpen={!!refundModalTicket}
        onClose={() => setRefundModalTicket(null)}
        title={`Process Refund / Replacement: ${refundModalTicket?.id}`}
        subtitle={`Customer: ${refundModalTicket?.customerName} • Linked Order: ${refundModalTicket?.orderNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleProcessRefundOrReplacement} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-border rounded-[12px] space-y-1">
            <p className="font-bold text-ink">Action Resolution Selection:</p>
            <p className="text-status-neutral">Select the resolution workflow to execute on the backend API.</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border border-border rounded-[12px] cursor-pointer hover:bg-rose-50/50">
              <input
                type="radio"
                name="refundType"
                value="Refund"
                checked={refundType === 'Refund'}
                onChange={() => setRefundType('Refund')}
                className="text-brand-raspberry focus:ring-brand-raspberry"
              />
              <div>
                <p className="font-bold text-ink">Process 100% Instant Refund</p>
                <p className="text-[11px] text-status-neutral">Credit customer wallet / original payment source.</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 border border-border rounded-[12px] cursor-pointer hover:bg-rose-50/50">
              <input
                type="radio"
                name="refundType"
                value="Replacement"
                checked={refundType === 'Replacement'}
                onChange={() => setRefundType('Replacement')}
                className="text-brand-raspberry focus:ring-brand-raspberry"
              />
              <div>
                <p className="font-bold text-ink">Dispatch Priority Order Replacement</p>
                <p className="text-[11px] text-status-neutral">Generate fresh replacement dispatch order at nearest FC.</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" type="button" onClick={() => setRefundModalTicket(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingRefund}>
              {isSubmittingRefund ? 'Processing...' : `Confirm ${refundType}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
