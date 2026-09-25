import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { TemperatureLogger } from '../components/domain/TemperatureLogger';
import { inventoryService } from '../services/inventoryService';
import { InventoryLot } from '../types';
import { Boxes, Eye, Film, GitCommit } from 'lucide-react';

/**
 * Real vendor-batch trace for this lot (vendor, supply order, quality
 * video) — replaces the old `LotTraceTree` here, which rendered a fixed,
 * hardcoded 5-node story ("Satara Organic Farms", "Aarav Patel (Paid)")
 * regardless of which lot was open. This card shows only what the backend
 * actually knows for THIS lot (InventoryRepository#listLots' real joins),
 * and says so plainly when a lot has no vendor link at all (e.g. a manual
 * stock adjustment).
 */
const VendorBatchTraceCard: React.FC<{ lot: InventoryLot }> = ({ lot }) => (
  <div className="bg-surface border border-border rounded-[12px] p-5 shadow-card">
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
      <div className="flex items-center gap-2">
        <GitCommit className="w-5 h-5 text-brand-berry" />
        <h3 className="text-sm font-bold text-ink">Vendor Batch & Quality Video</h3>
      </div>
      <Badge variant={lot.vendorTrace ? 'success' : 'neutral'}>
        {lot.vendorTrace ? 'Traced to a vendor supply' : 'No vendor link'}
      </Badge>
    </div>

    {lot.vendorTrace ? (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-status-neutral">Vendor</span>
            <span className="font-bold text-ink">{lot.vendorTrace.vendorName}</span>
          </div>
          <div>
            <span className="block text-status-neutral">Supply Order</span>
            <span className="font-mono-num font-semibold text-ink">{lot.vendorTrace.supplyNumber || '—'}</span>
          </div>
        </div>

        {lot.vendorTrace.videoUrl ? (
          <video
            controls
            src={lot.vendorTrace.videoUrl}
            className="w-full rounded-[10px] border border-border bg-black"
            style={{ maxHeight: 320 }}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-status-neutral bg-rose-50/60 border border-border rounded-[10px] p-3">
            <Film className="w-4 h-4" />
            This vendor has not uploaded a cleaning/packing video for this batch yet.
          </div>
        )}
      </div>
    ) : (
      <p className="text-xs text-status-neutral">
        This lot was not created from a received vendor supply order (e.g. a manual stock adjustment), so there is no
        vendor or video to trace.
      </p>
    )}
  </div>
);

export const InventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getLots();
      setLots(data);
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

  const filteredLots = lots.filter((l) => {
    const qLower = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !qLower ||
      l.lotNumber.toLowerCase().includes(qLower) ||
      l.productName.toLowerCase().includes(qLower) ||
      l.vendorName.toLowerCase().includes(qLower) ||
      l.sku.toLowerCase().includes(qLower) ||
      (l.batchNumber && l.batchNumber.toLowerCase().includes(qLower)) ||
      l.warehouseLocation.toLowerCase().includes(qLower) ||
      (l.lineage?.farmOrigin && l.lineage.farmOrigin.toLowerCase().includes(qLower));

    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<InventoryLot>[] = [
    { header: 'Lot ID', accessorKey: 'lotNumber', isMono: true },
    { header: 'Product Name', accessorKey: 'productName' },
    { header: 'SKU', accessorKey: 'sku', isMono: true },
    { header: 'Vendor Origin', accessorKey: 'vendorName' },
    {
      header: 'Available Stock',
      cell: (row) => (
        <span className="font-mono-num font-bold text-brand-berry">
          {row.availableWeightKg.toFixed(2)} kg
        </span>
      ),
    },
    {
      header: 'Vendor Video',
      cell: (row) =>
        row.vendorTrace?.videoUrl ? (
          <a
            href={row.vendorTrace.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-brand-berry underline underline-offset-2"
          >
            Watch
          </a>
        ) : (
          <span className="text-xs text-status-neutral">—</span>
        ),
    },
    {
      header: 'Expiry Date',
      cell: (row) => <span className="font-mono-num text-xs">{row.expiryDate}</span>,
    },
    {
      header: 'Lot Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'Active'
              ? 'success'
              : row.status === 'Low Stock'
              ? 'warning'
              : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setSelectedLot(row)}
        >
          Inspect Lot
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory Ledger & Cold Storage Lots"
        subtitle="Ledger-based stock tracking, cold chain temperature compliance, reservation states, and batch lineage."
        badge={<Badge variant="brand" icon={<Boxes className="w-3.5 h-3.5" />}>{lots.length} Active Lots</Badge>}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Active', value: 'Active' },
          { label: 'Low Stock', value: 'Low Stock' },
          { label: 'Quarantined', value: 'Quarantined' },
        ]}
        onRefresh={fetchLots}
      />

      <Card padding="none">
        <Table columns={columns} data={filteredLots} keyExtractor={(r) => r.id} isLoading={isLoading} />
      </Card>

      {/* Lot Inspection Drawer */}
      <DetailDrawer
        isOpen={!!selectedLot}
        onClose={() => setSelectedLot(null)}
        title={`Lot Audit & Ledger: ${selectedLot?.lotNumber}`}
        subtitle={`SKU: ${selectedLot?.sku} • Location: ${selectedLot?.warehouseLocation}`}
        width="xl"
      >
        {selectedLot && (
          <div className="space-y-6">
            {/* Stock Quantities breakdown */}
            <Card title="Stock Allocation Ledger Breakdown">
              <div className="grid grid-cols-3 gap-3 font-mono-num text-center">
                <div className="p-3 bg-rose-50 border border-border rounded-[12px]">
                  <span className="text-xs text-status-neutral font-sans block">Available Stock:</span>
                  <span className="text-lg font-extrabold text-brand-berry">{selectedLot.availableWeightKg} kg</span>
                </div>
                <div className="p-3 bg-rose-50 border border-border rounded-[12px]">
                  <span className="text-xs text-status-neutral font-sans block">Reserved (Cart/QC):</span>
                  <span className="text-lg font-bold text-status-info">{selectedLot.reservedWeightKg} kg</span>
                </div>
                <div className="p-3 bg-rose-50 border border-border rounded-[12px]">
                  <span className="text-xs text-status-neutral font-sans block">Picked / Out:</span>
                  <span className="text-lg font-bold text-status-neutral">{selectedLot.pickedWeightKg} kg</span>
                </div>
              </div>
            </Card>

            {/* Cold Chain IoT Temperature Component */}
            <TemperatureLogger
              currentTempCelsius={selectedLot.storageTempCelsius}
              locationName={selectedLot.warehouseLocation}
            />

            {/* Real vendor batch + quality video trace for this lot */}
            <VendorBatchTraceCard lot={selectedLot} />
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
