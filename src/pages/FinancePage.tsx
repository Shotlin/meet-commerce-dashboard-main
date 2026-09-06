import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { PermissionDenied } from '../components/states/PermissionDenied';
import { financeService } from '../services/financeService';
import { useAuth } from '../context/AuthContext';
import { isRouteAllowed } from '../utils/permissions';
import { FinanceSummary } from '../types';
import { IndianRupee, Download } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { role, setRole } = useAuth();
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const isAllowed = isRouteAllowed('/finance', role);

  useEffect(() => {
    if (isAllowed) {
      fetchFinance();
    }
  }, [isAllowed]);

  const fetchFinance = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getFinanceSummary();
      setFinance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPayoutLedger = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      let csv = `MEET COMMERCE VENDOR PAYOUT SETTLEMENT LEDGER\n`;
      csv += `Generated At,${new Date().toLocaleString()}\n`;
      csv += `GMV,₹${finance ? (finance.gmv / 100000).toFixed(2) : '0.00'} Lakhs\n`;
      csv += `Net Platform Revenue,₹${finance ? (finance.netRevenue / 100000).toFixed(2) : '0.00'} Lakhs\n\n`;
      csv += `Settlement ID,Vendor Beneficiary,Settlement Period,Payout Amount (INR),Settlement Status,Processed Timestamp\n`;
      
      (finance?.recentSettlements || []).forEach((s) => {
        csv += `"${s.id}","${s.vendorName}","${s.period}",${s.amount},"${s.status}","${s.processedAt}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `meet-commerce-payout-ledger-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAllowed) {
    return <PermissionDenied requiredRole="HQ Admin or Finance Lead" onSwitchRole={() => setRole('HQ Admin')} />;
  }

  const columns: Column<FinanceSummary['recentSettlements'][0]>[] = [
    { header: 'Settlement ID', accessorKey: 'id', isMono: true },
    { header: 'Vendor Beneficiary', accessorKey: 'vendorName' },
    { header: 'Settlement Period', accessorKey: 'period' },
    {
      header: 'Payout Amount',
      cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.amount.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Settlement Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'Settled'
              ? 'success'
              : row.status === 'Processing'
              ? 'info'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Processed Timestamp',
      cell: (row) => <span className="font-mono-num text-xs">{row.processedAt}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Finance Overview & Vendor Settlements"
        subtitle="Gross Merchandise Value (GMV), platform rake fees, refund audit, and automated vendor payout reconciliation."
        badge={<Badge variant="brand" icon={<IndianRupee className="w-3.5 h-3.5" />}>Payout Health: Optimal</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />}
            onClick={handleExportPayoutLedger}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Payout Ledger'}
          </Button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <span className="text-xs font-bold text-status-neutral">Gross Merchandise Value (GMV)</span>
          <p className="font-mono-num text-2xl font-extrabold text-ink mt-2">
            ₹{finance ? (finance.gmv / 100000).toFixed(2) : '0.00'} Lakhs
          </p>
          <p className="text-[11px] text-status-success font-bold mt-1">+14.2% vs last month</p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-bold text-status-neutral">Net Platform Revenue (15% Rake)</span>
          <p className="font-mono-num text-2xl font-extrabold text-brand-berry mt-2">
            ₹{finance ? (finance.netRevenue / 100000).toFixed(2) : '0.00'} Lakhs
          </p>
          <p className="text-[11px] text-status-neutral mt-1">Direct Commission</p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-bold text-status-neutral">Platform Gateway Fees</span>
          <p className="font-mono-num text-2xl font-extrabold text-ink mt-2">
            ₹{finance ? (finance.platformFees / 100000).toFixed(2) : '0.00'} Lakhs
          </p>
          <p className="text-[11px] text-status-neutral mt-1">Razorpay / HDFC fees</p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-bold text-status-neutral">Refunds & Adjustments</span>
          <p className="font-mono-num text-2xl font-extrabold text-status-warning mt-2">
            ₹{finance ? (finance.refundsTotal / 1000).toFixed(1) : '0.00'} K
          </p>
          <p className="text-[11px] text-status-neutral mt-1">0.28% of GMV (Within SLA)</p>
        </Card>
      </div>

      {/* Vendor Payout Settlements Table */}
      <Card title="Vendor Settlement Reconciliation Queue">
        <Table
          columns={columns}
          data={finance?.recentSettlements || []}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
};
