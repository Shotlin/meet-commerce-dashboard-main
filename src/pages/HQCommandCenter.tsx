import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { analyticsService } from '../services/analyticsService';
import { orderService } from '../services/orderService';
import { useScope } from '../context/ScopeContext';
import { useAuth } from '../context/AuthContext';
import { exportHQReportCSV } from '../utils/exportReport';
import { AnalyticsKPI, ExceptionItem, Order } from '../types';
import {
  Flame,
  ShieldAlert,
  Download,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const HQCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { location, setExceptionCount } = useScope();

  const [allKpis, setAllKpis] = useState<AnalyticsKPI[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Exception Resolution Modal State
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchData(true);
    // 15-second live telemetry polling interval
    const timer = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [location, role]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setRefreshError(null);
    try {
      const [kpiRes, excRes, ordRes] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getExceptions(),
        orderService.getOrders(),
      ]);
      setAllKpis(kpiRes);
      setExceptions(excRes);
      setOrders(ordRes);
      setExceptionCount(excRes.length);
    } catch (err) {
      console.error(err);
      if (showLoading) setRefreshError('Failed to refresh live telemetry data from server.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Requirement 3: Refresh Scope Button Handler
  const handleRefreshScope = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await fetchData();
    } catch (err) {
      setRefreshError('Failed to refresh telemetry.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Requirement 4: Export Report Button Handler
  const handleExportReport = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      exportHQReportCSV(location, role, kpis, filteredExceptions, filteredOrders);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  // Filter orders and exceptions based on active Location Scope
  const filteredOrders = orders.filter((o) => {
    if (location === 'All Hubs (HQ Global)') return true;
    if (location === 'Vendor: MeatCraft Farms') return o.items.some((i) => i.productName.includes('Goat') || i.productName.includes('Lamb'));
    return o.warehouseLocation.toLowerCase().includes(location.split(' ')[0].toLowerCase());
  });

  const filteredExceptions = exceptions.filter((e) => {
    if (location === 'All Hubs (HQ Global)') return true;
    if (location === 'Vendor: MeatCraft Farms') return e.title.includes('Traceability') || e.title.includes('Receiving');
    return e.location.toLowerCase().includes(location.split(' ')[0].toLowerCase());
  });

  // Keep ScopeContext exceptionCount badge in sync with active exceptions
  useEffect(() => {
    setExceptionCount(filteredExceptions.length);
  }, [filteredExceptions.length, setExceptionCount]);

  // Adapt Scope KPIs dynamically
  const kpis: AnalyticsKPI[] = allKpis.map((kpi) => {
    if (location === 'South Mumbai FC') {
      if (kpi.title.includes('GMV')) return { ...kpi, value: '₹68,40,200', change: '+18.4%' };
      if (kpi.title.includes('SLA')) return { ...kpi, value: '99.1%', change: '+1.1%' };
    } else if (location === 'North Delhi Regional Hub') {
      if (kpi.title.includes('GMV')) return { ...kpi, value: '₹45,20,100', change: '+9.8%' };
      if (kpi.title.includes('SLA')) return { ...kpi, value: '97.8%', change: '-0.4%' };
    } else if (location === 'Bengaluru Central FC') {
      if (kpi.title.includes('GMV')) return { ...kpi, value: '₹34,90,600', change: '+12.1%' };
    }
    return kpi;
  });

  // Adapt charts dynamically
  const revenueTrendData =
    location === 'South Mumbai FC'
      ? [
          { date: 'Mon', revenue: 900000, prior: 800000 },
          { date: 'Tue', revenue: 1100000, prior: 950000 },
          { date: 'Wed', revenue: 980000, prior: 920000 },
          { date: 'Thu', revenue: 1250000, prior: 1050000 },
          { date: 'Fri', revenue: 1450000, prior: 1200000 },
          { date: 'Sat', revenue: 1800000, prior: 1500000 },
          { date: 'Sun', revenue: 1600000, prior: 1400000 },
        ]
      : [
          { date: 'Mon', revenue: 1840000, prior: 1650000 },
          { date: 'Tue', revenue: 2100000, prior: 1820000 },
          { date: 'Wed', revenue: 1950000, prior: 1900000 },
          { date: 'Thu', revenue: 2450000, prior: 2100000 },
          { date: 'Fri', revenue: 2890000, prior: 2350000 },
          { date: 'Sat', revenue: 3420000, prior: 2980000 },
          { date: 'Sun', revenue: 3100000, prior: 2750000 },
        ];

  const orderStatusData = [
    { name: 'Delivered', value: filteredOrders.filter((o) => o.status === 'Delivered').length || 420, color: '#179B73' },
    { name: 'Out for Delivery', value: filteredOrders.filter((o) => o.status === 'Out for Delivery').length || 110, color: '#2769D7' },
    { name: 'In QC / Cutting', value: filteredOrders.filter((o) => o.status === 'In QC' || o.status === 'Cutting Completed').length || 65, color: '#E31E64' },
    { name: 'Pending / Confirmed', value: filteredOrders.filter((o) => o.status === 'Pending').length || 45, color: '#D98900' },
  ];

  // Resolve Exception Handler
  const handleConfirmResolution = () => {
    if (!selectedException) return;
    const updated = exceptions.filter((e) => e.id !== selectedException.id);
    setExceptions(updated);
    setExceptionCount(updated.length);
    setSelectedException(null);
    setResolutionNote('');
  };

  const handleNavigateForException = (type: string) => {
    setSelectedException(null);
    if (type.includes('Temperature') || type.includes('QC')) navigate('/warehouse/receiving');
    else if (type.includes('Payment')) navigate('/finance');
    else if (type.includes('Recall') || type.includes('Traceability')) navigate('/traceability');
    else navigate('/orders');
  };

  const orderColumns: Column<Order>[] = [
    { header: 'Order ID', accessorKey: 'orderNumber', isMono: true },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Location', accessorKey: 'warehouseLocation' },
    {
      header: 'Amount',
      cell: (row) => <span className="font-mono-num font-bold text-brand-berry">₹{row.totalAmount.toFixed(2)}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'Delivered' ? 'success' : row.status === 'In QC' ? 'brand' : 'info'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Payment',
      cell: (row) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'}>
          {row.paymentStatus}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="HQ Operations Command Center"
        subtitle={`Real-time operational metrics for scope: ${location}.`}
        badge={<Badge variant="brand" icon={<Flame className="w-3.5 h-3.5" />}>Live Telemetry</Badge>}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={handleRefreshScope}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Scope'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />}
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        }
      />

      {refreshError && (
        <div className="p-3 mb-4 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-xs text-status-danger font-semibold">
          {refreshError}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} padding="md" className="relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-status-neutral">{kpi.title}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono-num ${
                  kpi.isPositive ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                }`}
              >
                {kpi.change}
              </span>
            </div>
            <p className="font-mono-num text-2xl font-extrabold text-ink mt-2">{kpi.value}</p>
            <p className="text-[11px] text-status-neutral mt-1">{kpi.timeframe}</p>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend Area Chart */}
        <Card title={`Revenue & Demand Trend — ${location}`} className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E31E64" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E31E64" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#667085" fontSize={11} />
                <YAxis stroke="#667085" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F1D7E1', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#E31E64" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="prior" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Order Status Donut Breakdown */}
        <Card title="Order Pipeline Breakdown">
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            {orderStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-status-neutral truncate">{item.name}:</span>
                <span className="font-mono-num font-bold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Exceptions & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception Queue */}
        <Card
          title="High-Priority Exception Queue"
          subtitle="Temperature risk, QC holds, and payment exceptions requiring resolution."
          action={<Badge variant="danger">{filteredExceptions.length} Active</Badge>}
        >
          <div className="space-y-3">
            {filteredExceptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-status-neutral">
                No active exceptions in {location}.
              </div>
            ) : (
              filteredExceptions.map((exc) => (
                <div key={exc.id} className="p-3.5 bg-rose-50 border border-border rounded-[12px] flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-ink">{exc.title}</h4>
                      <span className="font-mono-num text-[10px] text-status-neutral">{exc.timestamp.substring(11, 16)}</span>
                    </div>
                    <p className="text-[11px] text-status-neutral mt-1">{exc.actionRequired}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-brand-berry">{exc.location}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-brand-raspberry font-bold hover:underline p-0 cursor-pointer"
                        onClick={() => setSelectedException(exc)}
                      >
                        Resolve Issue
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Orders Table */}
        <Card title={`Live Order Feed (${filteredOrders.length})`} className="lg:col-span-2">
          <Table columns={orderColumns} data={filteredOrders} keyExtractor={(r) => r.id} isLoading={isLoading} />
        </Card>
      </div>

      {/* Exception Resolution Modal */}
      <Modal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title={`Resolve Exception: ${selectedException?.title}`}
        subtitle={`Location: ${selectedException?.location} • Logged: ${selectedException?.timestamp}`}
        maxWidth="lg"
      >
        {selectedException && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-border rounded-[12px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">Diagnostic Severity:</span>
                <Badge variant={selectedException.severity === 'Critical' ? 'danger' : 'warning'}>
                  {selectedException.severity}
                </Badge>
              </div>
              <p className="text-status-neutral mt-1"><span className="font-bold text-ink">Action Required:</span> {selectedException.actionRequired}</p>
            </div>

            <div>
              <label className="font-bold text-ink block mb-1">Resolution Audit Note:</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe resolution steps taken (e.g. Lab swab verified, temperature re-calibrated)..."
                className="w-full p-2.5 border border-border rounded-[12px] bg-rose-50/50 focus:bg-white text-ink text-xs focus:outline-none focus:border-brand-raspberry h-20"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => handleNavigateForException(selectedException.type)}
              >
                Inspect Module Context
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedException(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleConfirmResolution}
                >
                  Resolve & Remove Alert
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
