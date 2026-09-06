import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { supportService, RecallIncident } from '../services/supportService';
import { useScope } from '../context/ScopeContext';
import { ShieldCheck, AlertOctagon, PhoneCall, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RecallsPage: React.FC = () => {
  const { setExceptionCount, refreshGlobalCounts } = useScope();
  const [recalls, setRecalls] = useState<RecallIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quarantine Modal State
  const [selectedRecallForQuarantine, setSelectedRecallForQuarantine] = useState<RecallIncident | null>(null);
  const [isQuarantining, setIsQuarantining] = useState(false);

  // Notify State
  const [notifyingRecallId, setNotifyingRecallId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    fetchRecalls();
  }, []);

  const fetchRecalls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await supportService.getRecalls();
      setRecalls(data);

      const activeCount = data.filter((r) => r.status === 'Active' || r.severity === 'High' || r.severity === 'Critical').length;
      setExceptionCount(activeCount);
    } catch (err: any) {
      console.error('[RecallsPage] API Error:', err);
      setError(err.message || 'Unable to fetch quality recalls from API (http://localhost:4500)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEmergencyQuarantine = async () => {
    if (!selectedRecallForQuarantine) return;
    setIsQuarantining(true);
    try {
      const updated = await supportService.issueEmergencyQuarantine(selectedRecallForQuarantine.id);
      setRecalls((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      const activeCount = recalls.filter((r) => (r.id === updated.id ? false : r.status === 'Active')).length;
      setExceptionCount(activeCount);
      refreshGlobalCounts().catch(() => {});

      setFeedback({
        type: 'success',
        text: `Emergency Lot Quarantine issued for Lot ${updated.lotNumber} (${updated.id}). Associated inventory locked across cold bays.`,
      });
      setSelectedRecallForQuarantine(null);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'danger', text: err.message || 'Failed to issue emergency quarantine.' });
    } finally {
      setIsQuarantining(false);
    }
  };

  const handleNotifyQualityTaskforce = async (recallId: string) => {
    setNotifyingRecallId(recallId);
    try {
      const res = await supportService.notifyTaskforce(recallId);
      setRecalls((prev) => prev.map((r) => (r.id === recallId ? { ...r, notified: true } : r)));
      setFeedback({ type: 'success', text: res.message });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'danger', text: err.message || 'Failed to notify quality taskforce.' });
    } finally {
      setNotifyingRecallId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-berry animate-spin mx-auto" />
        <p className="text-xs font-bold text-ink">Connecting to Live Quality Recalls API (/api/v1/support/recalls)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">Unable to Load Quality & Recalls Data</h3>
        <p className="text-xs text-status-neutral">{error}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchRecalls}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const activeRecallsCount = recalls.filter((r) => r.status === 'Active' || r.severity === 'High').length;

  return (
    <div>
      <PageHeader
        title="Quality Triage & Emergency Recall Command"
        subtitle="Complaint investigation, linked lot exposure calculator, stock hold/stop controls, and blast notifications."
        badge={
          <Badge variant={activeRecallsCount > 0 ? 'danger' : 'success'} icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            {activeRecallsCount > 0 ? `${activeRecallsCount} Active Recalls` : 'No Active Recalls'}
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchRecalls}>
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
        {recalls.map((r) => (
          <Card
            key={r.id}
            title={`Incident ${r.id}: ${r.reason}`}
            action={
              <Badge variant={r.status === 'Quarantined' ? 'warning' : r.severity === 'High' ? 'danger' : 'info'}>
                {r.status} ({r.severity} Severity)
              </Badge>
            }
            className="border-status-warning/40 bg-status-warning/5"
          >
            <div className="p-2 flex items-start gap-4">
              <AlertOctagon className="w-8 h-8 text-status-warning shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-status-neutral">
                  Affected Lot: <strong className="font-mono-num text-brand-berry">{r.lotNumber}</strong> • Units Impacted: <strong className="font-mono-num text-ink">{r.affectedUnits} units</strong> • Logged: <span className="font-mono-num">{r.createdAt}</span>
                </p>
                <div className="mt-4 flex gap-3">
                  {r.status !== 'Quarantined' ? (
                    <Button variant="danger" size="sm" onClick={() => setSelectedRecallForQuarantine(r)}>
                      Issue Emergency Lot Quarantine
                    </Button>
                  ) : (
                    <Badge variant="warning" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Emergency Lot Quarantined
                    </Badge>
                  )}

                  {!r.notified ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PhoneCall className={`w-3.5 h-3.5 ${notifyingRecallId === r.id ? 'animate-pulse' : ''}`} />}
                      onClick={() => handleNotifyQualityTaskforce(r.id)}
                      disabled={notifyingRecallId === r.id}
                    >
                      {notifyingRecallId === r.id ? 'Notifying...' : 'Notify Quality Taskforce'}
                    </Button>
                  ) : (
                    <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
                      Taskforce Dispatched
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Emergency Quarantine Confirmation Modal */}
      <Modal
        isOpen={!!selectedRecallForQuarantine}
        onClose={() => setSelectedRecallForQuarantine(null)}
        title={`Confirm Emergency Lot Quarantine: ${selectedRecallForQuarantine?.id}`}
        subtitle={`Lot ID: ${selectedRecallForQuarantine?.lotNumber} • Impacted Units: ${selectedRecallForQuarantine?.affectedUnits}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 border border-border rounded-[12px] space-y-1">
            <p className="font-bold text-ink">Reason for Quarantine:</p>
            <p className="text-status-neutral">{selectedRecallForQuarantine?.reason}</p>
          </div>

          <p className="text-status-neutral leading-relaxed">
            By issuing an emergency lot quarantine, all remaining stock in lot <strong className="font-mono-num text-ink">{selectedRecallForQuarantine?.lotNumber}</strong> across all cold storage bays will be locked in the inventory ledger and pending customer orders containing this lot will be automatically flagged for review.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setSelectedRecallForQuarantine(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmEmergencyQuarantine} disabled={isQuarantining}>
              {isQuarantining ? 'Issuing Quarantine...' : 'Confirm Emergency Quarantine'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
