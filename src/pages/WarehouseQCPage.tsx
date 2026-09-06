import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';
import { Stepper } from '../components/common/Stepper';
import { Modal } from '../components/common/Modal';
import { QCMeasurementTool } from '../components/domain/QCMeasurementTool';
import { TemperatureLogger } from '../components/domain/TemperatureLogger';
import { warehouseService } from '../services/warehouseService';
import { inventoryService } from '../services/inventoryService';
import { QCReceipt, QCStatus } from '../types';
import { useScope } from '../context/ScopeContext';
import { Warehouse, Plus, CheckCircle2 } from 'lucide-react';

export const WarehouseQCPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const { setQcHeldCount, refreshGlobalCounts } = useScope();

  const [receipts, setReceipts] = useState<QCReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [activeReceiptId, setActiveReceiptId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(3); // QC Check step
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action Modals State
  const [pendingDecision, setPendingDecision] = useState<{ measuredKg: number; declaredKg: number; status: QCStatus } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'warning' | 'danger'; text: string } | null>(null);

  // New Inbound Receipt Modal State
  const [isNewReceiptModalOpen, setIsNewReceiptModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('MeatCraft Farms Ltd.');
  const [newCategoryName, setNewCategoryName] = useState('Prime Mutton Cuts');
  const [newDeclaredQtyKg, setNewDeclaredQtyKg] = useState('500.0');
  const [newMeasuredQtyKg, setNewMeasuredQtyKg] = useState('498.5');
  const [newTemperature, setNewTemperature] = useState('2.8');

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await warehouseService.getQCReceipts();
      setReceipts(data);
      if (data.length > 0 && !activeReceiptId) {
        setActiveReceiptId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q) {
      setSearchParams({ q });
    } else {
      setSearchParams({});
    }
  };

  // Find currently active receipt for QC scale inspector
  const activeReceipt = receipts.find((r) => r.id === activeReceiptId) || receipts[0];

  // Called when user clicks Reject Batch, Hold for Quarantine, or Accept & Create Lot
  const handleDecisionTrigger = (measuredKg: number, status: QCStatus, declaredKg: number) => {
    setPendingDecision({ measuredKg, declaredKg, status });
    setDecisionNote(
      status === 'Rejected'
        ? 'Temperature spike / quality swab failure on receiving dock'
        : status === 'Quarantined'
        ? 'Secondary lab swab pending validation'
        : 'Weight within ±2% tolerance. Verified cold-chain compliance.'
    );
  };

  // Confirm Decision Execution & Update Receipt Log
  const handleConfirmDecision = async () => {
    if (!pendingDecision || !activeReceipt) return;
    setIsSubmitting(true);
    try {
      const targetId = activeReceipt.id;
      const notesText = `Scale Reading: ${pendingDecision.measuredKg} kg. Note: ${decisionNote}`;

      // Update QC Status in Service Layer
      const updated = await warehouseService.updateQCStatus(targetId, pendingDecision.status, notesText);
      
      // Update measured and declared values on the updated object
      updated.measuredQtyKg = pendingDecision.measuredKg;
      updated.declaredQtyKg = pendingDecision.declaredKg;
      updated.varianceQtyKg = pendingDecision.measuredKg - pendingDecision.declaredKg;

      let createdLotNumber = '';
      if (pendingDecision.status === 'Accepted') {
        // Create corresponding inventory lot in inventoryService for Section 1 Requirement
        createdLotNumber = `LOT-MEAT-${Math.floor(Math.random() * 9000 + 1000)}`;
        await inventoryService.createLot({
          lotNumber: createdLotNumber,
          productName: `${updated.categoryName} (Inbound Lot)`,
          vendorName: updated.vendorName,
          availableWeightKg: pendingDecision.measuredKg,
          storageTempCelsius: updated.temperatureCelsius,
          warehouseLocation: 'North Delhi Hub (Cold Bay 1)',
          status: 'Active',
          batchNumber: `BATCH-2026-${Math.floor(Math.random() * 90 + 10)}`,
        });
        updated.lotIdCreated = createdLotNumber;
      }

      // Update receipts array in React state immediately (WITHOUT duplicating rows)
      setReceipts((prev) => {
        const next = prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
        const remainingHeld = next.filter((r) => r.qcStatus === 'Pending QC' || r.qcStatus === 'Quarantined').length;
        setQcHeldCount(remainingHeld);
        return next;
      });

      refreshGlobalCounts().catch(() => {});

      if (pendingDecision.status === 'Accepted') {
        setCurrentStep(4); // Advance Stepper to Lot Created
        setActionFeedback({
          type: 'success',
          text: `Receipt ${updated.receiptNumber} Accepted! Inventory Lot ${createdLotNumber} created & added to Stock Ledger.`,
        });
      } else if (pendingDecision.status === 'Quarantined') {
        setActionFeedback({
          type: 'warning',
          text: `Receipt ${updated.receiptNumber} placed under Quarantine Hold. Receipts log updated.`,
        });
      } else {
        setActionFeedback({
          type: 'danger',
          text: `Receipt ${updated.receiptNumber} REJECTED. Receipts log updated & vendor notified.`,
        });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'danger', text: 'Failed to process QC decision action.' });
    } finally {
      setIsSubmitting(false);
      setPendingDecision(null);
    }
  };

  // Create New Inbound Receipt Handler
  const handleCreateNewReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newCategoryName) return;
    setIsSubmitting(true);
    try {
      const declared = parseFloat(newDeclaredQtyKg) || 100;
      const measured = parseFloat(newMeasuredQtyKg) || 100;
      const temp = parseFloat(newTemperature) || 3.0;

      const newRec = await warehouseService.createQCReceipt({
        receiptNumber: `QCR-2026-${Math.floor(Math.random() * 900 + 100)}`,
        appointmentId: `APT-${Math.floor(Math.random() * 9000 + 1000)}`,
        vendorName: newVendorName,
        categoryName: newCategoryName,
        declaredQtyKg: declared,
        measuredQtyKg: measured,
        varianceQtyKg: measured - declared,
        temperatureCelsius: temp,
        temperatureStatus: temp > 6.0 ? 'Critical' : temp > 4.0 ? 'Warning' : 'Normal',
        qcStatus: 'Pending QC',
        inspectorName: 'Sanjay Kumar (Senior QC)',
        notes: 'Inbound receipt logged at receiving bay.',
        evidencePhotoUrls: ['/assets/banner-01-premium-lamb.png'],
      });

      setReceipts((prev) => [newRec, ...prev]);
      setActiveReceiptId(newRec.id);
      setIsNewReceiptModalOpen(false);
      setActionFeedback({
        type: 'success',
        text: `New Inbound Receipt ${newRec.receiptNumber} registered and set as active scale target.`,
      });
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'danger', text: 'Failed to register new inbound receipt.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    const qLower = searchQuery.toLowerCase();
    return (
      !qLower ||
      r.receiptNumber.toLowerCase().includes(qLower) ||
      r.vendorName.toLowerCase().includes(qLower) ||
      r.categoryName.toLowerCase().includes(qLower)
    );
  });

  const steps = [
    { id: '1', title: 'Appointment Slot', description: 'Manifest verified' },
    { id: '2', title: 'Vehicle Arrived', description: 'Seal code checked' },
    { id: '3', title: 'Weighed & Measured', description: 'Scale reading logged' },
    { id: '4', title: 'Cold & QC Check', description: 'Ph & temp swab' },
    { id: '5', title: 'Lot Created', description: 'Inbound complete' },
  ];

  const columns: Column<QCReceipt>[] = [
    {
      header: 'Receipt ID',
      accessorKey: 'receiptNumber',
      cell: (row) => (
        <span
          className={`font-mono-num cursor-pointer ${
            row.id === activeReceiptId ? 'font-extrabold text-brand-raspberry underline' : 'text-ink'
          }`}
          onClick={() => setActiveReceiptId(row.id)}
          title="Click to select for scale inspector"
        >
          {row.receiptNumber}
        </span>
      ),
    },
    { header: 'Vendor Source', accessorKey: 'vendorName' },
    { header: 'Category', accessorKey: 'categoryName' },
    {
      header: 'Declared (kg)',
      cell: (row) => <span className="font-mono-num">{row.declaredQtyKg.toFixed(2)}</span>,
    },
    {
      header: 'Measured (kg)',
      cell: (row) => <span className="font-mono-num font-bold text-brand-berry">{row.measuredQtyKg.toFixed(2)}</span>,
    },
    {
      header: 'Receiving Temp',
      cell: (row) => (
        <span
          className={`font-mono-num text-xs font-semibold px-2 py-0.5 rounded-full ${
            row.temperatureStatus === 'Normal'
              ? 'bg-status-success/10 text-status-success'
              : 'bg-status-warning/10 text-status-warning'
          }`}
        >
          {row.temperatureCelsius.toFixed(1)} °C
        </span>
      ),
    },
    {
      header: 'QC Decision',
      cell: (row) => (
        <Badge
          variant={
            row.qcStatus === 'Accepted'
              ? 'success'
              : row.qcStatus === 'Quarantined'
              ? 'warning'
              : row.qcStatus === 'Rejected'
              ? 'danger'
              : 'info'
          }
        >
          {row.qcStatus}
        </Badge>
      ),
    },
    {
      header: 'Scale Target',
      cell: (row) => (
        <Button
          variant={row.id === activeReceiptId ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveReceiptId(row.id)}
        >
          {row.id === activeReceiptId ? 'Active Target' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouse Inbound Receiving & Quality Control"
        subtitle="5-stage inbound receiving pipeline, cold-chain temperature verification, and lot creation."
        badge={<Badge variant="brand" icon={<Warehouse className="w-3.5 h-3.5" />}>Active Receiving Bay</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewReceiptModalOpen(true)}
          >
            New Inbound Receipt
          </Button>
        }
      />

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 mb-5 rounded-[12px] border text-xs font-bold flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : actionFeedback.type === 'warning'
              ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 5-Step Inbound Receiving Pipeline */}
      <Stepper steps={steps} currentStepIndex={currentStep} onStepClick={(i) => setCurrentStep(i)} />

      {/* Inbound QC Measurement & Temperature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Measured vs Declared Inspector Tool */}
        <QCMeasurementTool
          targetReceiptNumber={activeReceipt?.receiptNumber || 'QCR-2026-0912'}
          initialDeclaredKg={activeReceipt?.declaredQtyKg || 450.0}
          initialMeasuredKg={activeReceipt?.measuredQtyKg || 448.2}
          onDecision={handleDecisionTrigger}
        />

        {/* Live IoT Sensor Reading */}
        <TemperatureLogger
          currentTempCelsius={activeReceipt?.temperatureCelsius || 2.4}
          locationName="North Delhi Hub - Receiving Bay 1"
        />
      </div>

      <div className="mb-4">
        <FilterBar searchQuery={searchQuery} onSearchChange={handleSearchChange} onRefresh={fetchReceipts} />
      </div>

      {/* Inbound QC Receipts Log Table */}
      <Card title="Inbound QC Receipts Log (Click row to select as scale target)">
        <Table columns={columns} data={filteredReceipts} keyExtractor={(r) => r.id} isLoading={isLoading} />
      </Card>

      {/* Confirmation Modal for QC Decision Actions (Accept, Quarantine, Reject) */}
      <Modal
        isOpen={!!pendingDecision}
        onClose={() => setPendingDecision(null)}
        title={`Confirm QC Decision: ${pendingDecision?.status}`}
        subtitle={`Target Receipt: ${activeReceipt?.receiptNumber} • Vendor: ${activeReceipt?.vendorName} • Measured Weight: ${pendingDecision?.measuredKg} kg`}
        maxWidth="md"
      >
        {pendingDecision && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-border rounded-[12px] space-y-1">
              <span className="font-bold text-ink block mb-1">Target Action & Resulting Status:</span>
              <Badge
                variant={
                  pendingDecision.status === 'Accepted'
                    ? 'success'
                    : pendingDecision.status === 'Quarantined'
                    ? 'warning'
                    : 'danger'
                }
              >
                {pendingDecision.status === 'Accepted'
                  ? 'Accept & Create Inventory Lot'
                  : pendingDecision.status === 'Quarantined'
                  ? 'Hold for Quarantine Inspection'
                  : 'Reject Batch & Return to Supplier'}
              </Badge>
            </div>

            <div>
              <label className="font-bold text-ink block mb-1">QC Decision Audit Note:</label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                className="w-full p-2.5 border border-border rounded-[12px] bg-white text-ink text-xs focus:outline-none focus:border-brand-raspberry h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setPendingDecision(null)}>
                Cancel
              </Button>
              <Button
                variant={
                  pendingDecision.status === 'Accepted'
                    ? 'primary'
                    : pendingDecision.status === 'Quarantined'
                    ? 'secondary'
                    : 'danger'
                }
                size="sm"
                onClick={handleConfirmDecision}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Processing...'
                  : pendingDecision.status === 'Accepted'
                  ? 'Confirm Acceptance & Create Lot'
                  : pendingDecision.status === 'Quarantined'
                  ? 'Confirm Quarantine Hold'
                  : 'Confirm Batch Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Inbound Receipt Modal */}
      <Modal
        isOpen={isNewReceiptModalOpen}
        onClose={() => setIsNewReceiptModalOpen(false)}
        title="Register New Inbound Receipt"
        subtitle="Log vendor shipment arrival, manifest declared weight, and receiving bay temperature."
        maxWidth="md"
      >
        <form onSubmit={handleCreateNewReceipt} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-ink block mb-1">Vendor Supplier Name:</label>
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              className="w-full p-2 bg-rose-50/50 border border-border rounded-[12px] focus:bg-white text-ink font-semibold focus:outline-none focus:border-brand-raspberry"
              required
            />
          </div>

          <div>
            <label className="font-bold text-ink block mb-1">Product Category:</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 bg-rose-50/50 border border-border rounded-[12px] focus:bg-white text-ink font-semibold focus:outline-none focus:border-brand-raspberry"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-ink block mb-1">Declared (kg):</label>
              <input
                type="number"
                step="0.1"
                value={newDeclaredQtyKg}
                onChange={(e) => setNewDeclaredQtyKg(e.target.value)}
                className="w-full p-2 bg-rose-50/50 border border-border rounded-[12px] font-mono-num font-bold text-ink focus:outline-none focus:border-brand-raspberry"
                required
              />
            </div>
            <div>
              <label className="font-bold text-ink block mb-1">Measured (kg):</label>
              <input
                type="number"
                step="0.1"
                value={newMeasuredQtyKg}
                onChange={(e) => setNewMeasuredQtyKg(e.target.value)}
                className="w-full p-2 bg-rose-50/50 border border-border rounded-[12px] font-mono-num font-bold text-brand-berry focus:outline-none focus:border-brand-raspberry"
                required
              />
            </div>
            <div>
              <label className="font-bold text-ink block mb-1">Temp (°C):</label>
              <input
                type="number"
                step="0.1"
                value={newTemperature}
                onChange={(e) => setNewTemperature(e.target.value)}
                className="w-full p-2 bg-rose-50/50 border border-border rounded-[12px] font-mono-num font-bold text-status-success focus:outline-none focus:border-brand-raspberry"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewReceiptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Register Inbound Receipt'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
