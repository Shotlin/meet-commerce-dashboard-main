import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';
import { DetailDrawer } from '../components/layout/DetailDrawer';
import { CuttingEvidencePlayer } from '../components/domain/CuttingEvidencePlayer';
import { LotTraceTree } from '../components/domain/LotTraceTree';
import { orderService } from '../services/orderService';
import { Order, VideoModerationStatus } from '../types';
import { ShoppingBag, Video, Eye } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync searchQuery from URL parameter
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
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

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let csv = 'Order ID,Customer,Location,Total Value (INR),Fulfillment Status,Cutting Evidence,Payment Status\n';
    filteredOrders.forEach((o) => {
      csv += `"${o.orderNumber}","${o.customerName}","${o.warehouseLocation}",${o.totalAmount},"${o.status}","${o.videoModerationStatus || 'N/A'}","${o.paymentStatus}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `meet-commerce-orders-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleModerated = async (newStatus: VideoModerationStatus) => {
    if (!selectedOrder) return;
    try {
      const updated = await orderService.updateVideoModeration(selectedOrder.id, newStatus);
      setSelectedOrder(updated);
      setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const queryLower = searchQuery.toLowerCase();
    const matchesQuery =
      !queryLower ||
      o.orderNumber.toLowerCase().includes(queryLower) ||
      o.customerName.toLowerCase().includes(queryLower) ||
      o.warehouseLocation.toLowerCase().includes(queryLower);
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesQuery && matchesStatus;
  });

  const columns: Column<Order>[] = [
    { header: 'Order ID', accessorKey: 'orderNumber', isMono: true },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'FC / Warehouse', accessorKey: 'warehouseLocation' },
    {
      header: 'Total Value',
      cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.totalAmount.toFixed(2)}</span>,
    },
    {
      header: 'Fulfillment Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'Delivered'
              ? 'success'
              : row.status === 'In QC' || row.status === 'Cutting Completed'
              ? 'brand'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Cutting Evidence',
      cell: (row) =>
        row.cuttingEvidenceUrl ? (
          <Badge
            variant={
              row.videoModerationStatus === 'Approved'
                ? 'success'
                : row.videoModerationStatus === 'Rejected'
                ? 'danger'
                : 'warning'
            }
            icon={<Video className="w-3.5 h-3.5" />}
          >
            {row.videoModerationStatus || 'Pending'}
          </Badge>
        ) : (
          <span className="text-xs text-status-neutral">N/A</span>
        ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setSelectedOrder(row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders & Vendor Cutting Evidence"
        subtitle="Manage customer orders, variable-weight fulfillment, rider assignment, and video evidence moderation."
        badge={<Badge variant="brand" icon={<ShoppingBag className="w-3.5 h-3.5" />}>{orders.length} Active Orders</Badge>}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Pending', value: 'Pending' },
          { label: 'In QC', value: 'In QC' },
          { label: 'Cutting Completed', value: 'Cutting Completed' },
          { label: 'Out for Delivery', value: 'Out for Delivery' },
          { label: 'Delivered', value: 'Delivered' },
        ]}
        onRefresh={fetchOrders}
        onExport={handleExportCSV}
      />

      <Card padding="none">
        <Table columns={columns} data={filteredOrders} keyExtractor={(r) => r.id} isLoading={isLoading} />
      </Card>

      {/* Order Detail & Cutting Video Drawer */}
      <DetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details & Audit: ${selectedOrder?.orderNumber}`}
        subtitle={`Customer: ${selectedOrder?.customerName} • ${selectedOrder?.warehouseLocation}`}
        width="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Cutting Evidence Player Section */}
            {selectedOrder.cuttingEvidenceUrl && (
              <CuttingEvidencePlayer
                orderNumber={selectedOrder.orderNumber}
                videoUrl={selectedOrder.cuttingEvidenceUrl}
                moderationStatus={selectedOrder.videoModerationStatus}
                weightVarianceKg={selectedOrder.weightVarianceKg}
                onModerated={handleModerated}
              />
            )}

            {/* Line Items & Variable Weight Calculator */}
            <Card title="Variable-Weight Line Items Breakdown">
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3.5 bg-rose-50 border border-border rounded-[12px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-ink">{item.productName}</h4>
                        <p className="text-[11px] text-status-neutral mt-0.5">
                          Category: {item.category} • Cut: {item.cutType}
                        </p>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-brand-berry">
                        ₹{item.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between font-mono-num text-xs">
                      <div>
                        <span className="text-status-neutral">Declared: </span>
                        <span className="font-semibold text-ink">{item.declaredWeightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-status-neutral">Actual Scale: </span>
                        <span className="font-bold text-brand-raspberry">
                          {item.actualWeightKg ? `${item.actualWeightKg} kg` : 'Pending Weighing'}
                        </span>
                      </div>
                      <div>
                        <span className="text-status-neutral font-sans">Trace Lot: </span>
                        <span className="font-semibold text-brand-berry">{item.lotId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Lot Trace Lineage Component */}
            <LotTraceTree orderNumber={selectedOrder.orderNumber} lotId={selectedOrder.lotTraceIds[0]} />
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
