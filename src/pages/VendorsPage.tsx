import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';
import { Modal } from '../components/common/Modal';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { vendorService } from '../services/vendorService';
import { Vendor } from '../types';
import { Store, CheckCircle2, FileText, Download, ShieldCheck } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify KYC Modal State
  const [selectedVendorForKyc, setSelectedVendorForKyc] = useState<Vendor | null>(null);

  // Vendor Compliance Documents Drawer State
  const [selectedVendorForDocs, setSelectedVendorForDocs] = useState<Vendor | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const data = await vendorService.getVendors();
      setVendors(data);
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

  const handleConfirmVerifyKyc = async () => {
    if (!selectedVendorForKyc) return;
    setIsSubmitting(true);
    try {
      const updated = await vendorService.updateVendorKyc(selectedVendorForKyc.id, 'Verified');
      setVendors(vendors.map((v) => (v.id === updated.id ? updated : v)));
      setActionFeedback({
        type: 'success',
        text: `KYC for ${updated.companyName} successfully verified. Risk score updated to LOW.`,
      });
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: 'danger', text: `Failed to verify KYC for ${selectedVendorForKyc.companyName}.` });
    } finally {
      setIsSubmitting(false);
      setSelectedVendorForKyc(null);
    }
  };

  const handleDownloadDoc = (docTitle: string, companyName: string) => {
    const text = `MEET COMMERCE VENDOR COMPLIANCE AUDIT CERTIFICATE\nVendor: ${companyName}\nDocument: ${docTitle}\nAudit Status: VERIFIED COMPLIANT\nTimestamp: ${new Date().toLocaleString()}\n`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredVendors = vendors.filter((v) => {
    const qLower = searchQuery.toLowerCase();
    return (
      !qLower ||
      v.companyName.toLowerCase().includes(qLower) ||
      v.category.toLowerCase().includes(qLower) ||
      v.licenseNumber.toLowerCase().includes(qLower) ||
      v.id.toLowerCase().includes(qLower)
    );
  });

  const columns: Column<Vendor>[] = [
    { header: 'Vendor ID', accessorKey: 'id', isMono: true },
    { header: 'Company Name', accessorKey: 'companyName' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'FSSAI License', accessorKey: 'licenseNumber', isMono: true },
    {
      header: 'KYC Status',
      cell: (row) => (
        <Badge
          variant={
            row.kycStatus === 'Verified'
              ? 'success'
              : row.kycStatus === 'Under Review'
              ? 'warning'
              : 'danger'
          }
        >
          {row.kycStatus}
        </Badge>
      ),
    },
    {
      header: 'Risk Score',
      cell: (row) => (
        <Badge variant={row.riskScore === 'Low' ? 'success' : row.riskScore === 'Medium' ? 'warning' : 'danger'}>
          {row.riskScore} Risk
        </Badge>
      ),
    },
    {
      header: 'Fulfilled GMV',
      cell: (row) => (
        <span className="font-mono-num font-bold text-brand-berry">
          ₹{(row.totalFulfilledValue / 100000).toFixed(2)} Lakhs
        </span>
      ),
    },
    {
      header: 'KYC Actions',
      cell: (row) => (
        <div className="flex gap-1.5">
          {row.kycStatus !== 'Verified' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={() => setSelectedVendorForKyc(row)}
            >
              Verify KYC
            </Button>
          ) : (
            <Badge variant="success" icon={<ShieldCheck className="w-3 h-3" />}>
              Verified
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<FileText className="w-3.5 h-3.5" />}
            onClick={() => setSelectedVendorForDocs(row)}
          >
            Docs
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vendor Management & Procurement"
        subtitle="Manage vendor onboarding, FSSAI licensing compliance, KYC verification, and supply contract awards."
        badge={<Badge variant="brand" icon={<Store className="w-3.5 h-3.5" />}>{vendors.length} Onboarded Vendors</Badge>}
      />

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 mb-5 rounded-[12px] border text-xs font-bold flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <FilterBar searchQuery={searchQuery} onSearchChange={handleSearchChange} onRefresh={fetchVendors} />

      <Card padding="none">
        <Table columns={columns} data={filteredVendors} keyExtractor={(r) => r.id} isLoading={isLoading} />
      </Card>

      {/* Verify KYC Confirmation Modal */}
      <Modal
        isOpen={!!selectedVendorForKyc}
        onClose={() => setSelectedVendorForKyc(null)}
        title={`Verify KYC: ${selectedVendorForKyc?.companyName}`}
        subtitle={`Vendor ID: ${selectedVendorForKyc?.id} • Category: ${selectedVendorForKyc?.category}`}
        maxWidth="md"
      >
        {selectedVendorForKyc && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-border rounded-[12px] space-y-2 font-mono-num">
              <div className="flex justify-between">
                <span className="text-status-neutral font-sans">FSSAI License:</span>
                <span className="font-bold text-ink">{selectedVendorForKyc.licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-status-neutral font-sans">Current Status:</span>
                <Badge variant={selectedVendorForKyc.kycStatus === 'Under Review' ? 'warning' : 'danger'}>
                  {selectedVendorForKyc.kycStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-status-neutral font-sans">Total Fulfilled GMV:</span>
                <span className="font-bold text-brand-berry">
                  ₹{(selectedVendorForKyc.totalFulfilledValue / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>

            <p className="text-status-neutral leading-relaxed">
              By confirming, you verify that FSSAI licensing certificates, GST registration tax IDs, cold chain SLA terms, and lab swab test reports have been audited for <strong className="text-ink">{selectedVendorForKyc.companyName}</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setSelectedVendorForKyc(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleConfirmVerifyKyc}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Approve & Confirm KYC'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Vendor Compliance Documents Drawer */}
      <DetailDrawer
        isOpen={!!selectedVendorForDocs}
        onClose={() => setSelectedVendorForDocs(null)}
        title={`Compliance Documents & Certificates: ${selectedVendorForDocs?.companyName}`}
        subtitle={`Vendor ID: ${selectedVendorForDocs?.id} • License: ${selectedVendorForDocs?.licenseNumber}`}
        width="lg"
      >
        {selectedVendorForDocs && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-border rounded-[12px] flex items-center justify-between">
              <div>
                <p className="font-bold text-ink">{selectedVendorForDocs.companyName}</p>
                <p className="text-[11px] text-status-neutral mt-0.5">
                  Category: {selectedVendorForDocs.category} • Risk Score: {selectedVendorForDocs.riskScore}
                </p>
              </div>
              <Badge variant={selectedVendorForDocs.kycStatus === 'Verified' ? 'success' : 'warning'}>
                {selectedVendorForDocs.kycStatus}
              </Badge>
            </div>

            <Card title="Uploaded Compliance & Regulatory Documents">
              <div className="space-y-3">
                {/* Doc 1: FSSAI License */}
                <div className="p-3 border border-border rounded-[12px] flex items-center justify-between hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-rose-100 text-brand-berry font-bold flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">FSSAI Food Safety License Certificate</p>
                      <p className="text-[11px] text-status-neutral font-mono-num">License #: {selectedVendorForDocs.licenseNumber} • Verified Active</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadDoc('FSSAI Food Safety License', selectedVendorForDocs.companyName)}
                  >
                    Download
                  </Button>
                </div>

                {/* Doc 2: GSTIN Registration */}
                <div className="p-3 border border-border rounded-[12px] flex items-center justify-between hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-rose-100 text-brand-berry font-bold flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">GST Tax Registration Certificate</p>
                      <p className="text-[11px] text-status-neutral font-mono-num">GSTIN: 07AAAAA{selectedVendorForDocs.id.replace('VEN-', '99')}A1Z5 • Active</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadDoc('GST Registration Certificate', selectedVendorForDocs.companyName)}
                  >
                    Download
                  </Button>
                </div>

                {/* Doc 3: Cold Chain SLA Contract */}
                <div className="p-3 border border-border rounded-[12px] flex items-center justify-between hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-rose-100 text-brand-berry font-bold flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">Cold-Chain Temperature SLA Agreement</p>
                      <p className="text-[11px] text-status-neutral">Mandatory 0°C to 4°C Transit Guarantee</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadDoc('Cold Chain SLA Contract', selectedVendorForDocs.companyName)}
                  >
                    Download
                  </Button>
                </div>

                {/* Doc 4: Microbiological Lab Swab Report */}
                <div className="p-3 border border-border rounded-[12px] flex items-center justify-between hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-rose-100 text-brand-berry font-bold flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">Independent Lab Swab Test Certificate</p>
                      <p className="text-[11px] text-status-neutral font-mono-num">Report #: LAB-SWAB-2026-PASS • Verified 100% Pathogen Free</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadDoc('Lab Swab Test Certificate', selectedVendorForDocs.companyName)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
