import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Boxes, QrCode, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

export const FulfilmentPage: React.FC = () => {
  // Fulfilment Task State
  const [activeTask] = useState({
    orderNumber: 'MC-2026-8841',
    customerName: 'Ananya Sharma',
    location: 'South Mumbai FC',
    binLocation: 'A4 - Cold Bay 3',
    productName: 'Premium Goat Curry Cut 1.00kg',
    expectedLotBarcode: 'LOT-MEAT-4921',
    declaredWeightKg: 1.000,
    scaleWeightKg: 1.045,
    sealId: 'SEAL-994821',
  });

  // 1. Scan Verification State
  const [scannedBarcode, setScannedBarcode] = useState(activeTask.expectedLotBarcode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLotVerified, setIsLotVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // 2. Print Label & Stamp State
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLabelPrinted, setIsLabelPrinted] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Handle Scan Verification
  const handleScanVerification = () => {
    if (isVerifying || isLotVerified) return;
    setIsVerifying(true);
    setVerificationError(null);

    setTimeout(() => {
      const inputTrimmed = scannedBarcode.trim().toUpperCase();
      if (inputTrimmed === activeTask.expectedLotBarcode) {
        setIsLotVerified(true);
        setVerificationError(null);
      } else {
        setVerificationError(`Invalid Barcode "${scannedBarcode}". Expected ${activeTask.expectedLotBarcode} for Order ${activeTask.orderNumber}.`);
      }
      setIsVerifying(false);
    }, 450);
  };

  // Handle Print Label & Stamp
  const handlePrintLabel = () => {
    if (!activeTask.scaleWeightKg || !activeTask.sealId) {
      alert('Scale weight and Tamper-Evident Seal ID must be verified before printing label.');
      return;
    }
    setIsPrinting(true);
    setIsPrintModalOpen(true);
    setIsPrinting(false);
  };

  // Execute Browser Print Dialog
  const triggerBrowserPrint = () => {
    setIsLabelPrinted(true);
    window.print();
  };

  return (
    <div>
      <PageHeader
        title="Fulfilment & Packing Station"
        subtitle="Pick wave optimization, barcode lot scanning, actual weight capture, and seal label generation."
        badge={<Badge variant="brand" icon={<Boxes className="w-3.5 h-3.5" />}>Wave #42 In Progress</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Picker Task & Barcode Simulator */}
        <Card title="Picker Task & Barcode Simulator">
          <div className="p-4 bg-rose-50 border border-border rounded-[12px] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-ink">Active Task: Order {activeTask.orderNumber}</span>
              <Badge variant="info">{activeTask.binLocation}</Badge>
            </div>
            <p className="text-xs text-status-neutral">Product: {activeTask.productName}</p>

            <div className="p-3 bg-white border border-border rounded-[12px] space-y-2">
              <label className="text-[10px] text-status-neutral block font-sans">Scan Lot Barcode:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scannedBarcode}
                  disabled={isLotVerified}
                  onChange={(e) => {
                    setScannedBarcode(e.target.value);
                    setVerificationError(null);
                  }}
                  className="flex-1 font-mono-num text-xs font-bold text-brand-berry px-3 py-1.5 bg-rose-50/50 border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry disabled:opacity-75"
                  placeholder="Enter or scan LOT-MEAT-4921..."
                />
                <Button
                  variant={isLotVerified ? 'outline' : 'secondary'}
                  size="sm"
                  icon={isLotVerified ? <CheckCircle2 className="w-4 h-4 text-status-success" /> : <QrCode className="w-4 h-4" />}
                  onClick={handleScanVerification}
                  disabled={isVerifying || isLotVerified}
                >
                  {isVerifying ? 'Verifying...' : isLotVerified ? '✓ Lot Verified' : 'Scan Verification'}
                </Button>
              </div>
            </div>

            {/* Scan Error Message */}
            {verificationError && (
              <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-xs font-bold text-status-danger flex items-center justify-between">
                <span>{verificationError}</span>
                <button onClick={() => setVerificationError(null)} className="underline text-[11px] cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            {/* Scan Verification Success Feedback */}
            {isLotVerified && (
              <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-[12px] text-xs font-bold text-status-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Lot {activeTask.expectedLotBarcode} verified successfully at Bin {activeTask.binLocation}. Ready for packaging.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Pack Station & Tamper Seal Label Print */}
        <Card title="Pack Station & Tamper Seal Label Print">
          <div className="p-4 bg-rose-50 border border-border rounded-[12px] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-ink">Scale Weight Verified</span>
              <Badge variant="success">
                {activeTask.scaleWeightKg.toFixed(3)} kg (+{(activeTask.scaleWeightKg - activeTask.declaredWeightKg).toFixed(3)}kg)
              </Badge>
            </div>

            <div className="p-3 bg-white border border-border rounded-[12px] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink">Tamper-Evident Seal ID:</span>
                <p className="font-mono-num text-xs text-brand-raspberry font-bold">{activeTask.sealId}</p>
              </div>
              <Button
                variant={isLabelPrinted ? 'outline' : 'primary'}
                size="sm"
                icon={isLabelPrinted ? <CheckCircle2 className="w-4 h-4 text-status-success" /> : <Printer className="w-4 h-4" />}
                onClick={handlePrintLabel}
                disabled={isPrinting}
              >
                {isPrinting ? 'Preparing...' : isLabelPrinted ? '✓ Label Printed' : 'Print Label & Stamp'}
              </Button>
            </div>

            {/* Print Confirmation Success Feedback */}
            {isLabelPrinted && (
              <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-[12px] text-xs font-bold text-status-success flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Label Printed & Tamper Seal {activeTask.sealId} applied. Order {activeTask.orderNumber} staged for dispatch.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Interactive Shipping & Seal Label Print Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Fulfilment Shipping & Seal Label Preview"
        subtitle={`Order: ${activeTask.orderNumber} • Tamper Seal: ${activeTask.sealId}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Printable Shipping Label Component (Targeted by @media print) */}
          <div
            id="printable-label-stamp"
            className="p-5 bg-white border-2 border-ink rounded-[12px] space-y-3 font-mono-num text-ink"
          >
            <div className="border-b-2 border-ink pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm tracking-wider font-sans uppercase">MEET COMMERCE PACKING LABEL</h3>
                <p className="text-[10px] text-status-neutral font-sans">Cold-Chain Fresh Meat Fulfillment</p>
              </div>
              <Badge variant="brand">DISPATCH READY</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Order ID:</span>
                <span className="font-extrabold text-brand-berry text-sm">{activeTask.orderNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Customer:</span>
                <span className="font-bold text-ink">{activeTask.customerName}</span>
              </div>
            </div>

            <div className="border-t border-border pt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Product & Cut:</span>
                <span className="font-bold text-ink font-sans">{activeTask.productName}</span>
              </div>
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Lot ID Verified:</span>
                <span className="font-bold text-brand-berry">{activeTask.expectedLotBarcode}</span>
              </div>
            </div>

            <div className="border-t border-border pt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Scale Actual Weight:</span>
                <span className="font-extrabold text-brand-raspberry text-sm">{activeTask.scaleWeightKg.toFixed(3)} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-status-neutral font-sans block">Tamper Seal ID:</span>
                <span className="font-extrabold text-status-success text-sm">{activeTask.sealId}</span>
              </div>
            </div>

            {/* QC Stamp Badge */}
            <div className="mt-3 p-2 bg-rose-50 border border-brand-berry/30 rounded-[8px] flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-1.5 font-bold text-brand-berry">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                <span>COLD-CHAIN AUDITED & PASSED</span>
              </div>
              <span className="font-mono-num text-[10px] font-bold text-status-neutral">{new Date().toLocaleTimeString()}</span>
            </div>

            {/* Barcode Visual Representation */}
            <div className="pt-2 text-center border-t border-border">
              <div className="tracking-[6px] text-lg font-bold font-mono text-ink">
                *{activeTask.orderNumber}-{activeTask.sealId}*
              </div>
              <span className="text-[9px] text-status-neutral font-sans">Scan at Rider Handover Terminal</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setIsPrintModalOpen(false)}>
              Close Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => {
                triggerBrowserPrint();
                setIsPrintModalOpen(false);
              }}
            >
              Trigger System Print & Apply Seal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
