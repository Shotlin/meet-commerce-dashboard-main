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
import { LotTraceTree } from '../components/domain/LotTraceTree';
import { inventoryService } from '../services/inventoryService';
import { InventoryLot } from '../types';
import { Boxes, Eye } from 'lucide-react';

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
      header: 'Storage Temp',
      cell: (row) => (
        <span className="font-mono-num text-xs font-semibold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
          {row.storageTempCelsius.toFixed(1)} °C
        </span>
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

            {/* Lot Traceability Tree */}
            <LotTraceTree lotId={selectedLot.lotNumber} />
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
