import { AnalyticsKPI, ExceptionItem, Order, ScopeLocation, UserRole } from '../types';

export function exportHQReportCSV(
  location: ScopeLocation,
  role: UserRole,
  kpis: AnalyticsKPI[],
  exceptions: ExceptionItem[],
  orders: Order[]
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestampStr = new Date().toLocaleString();

  let csvContent = `MEET COMMERCE HQ OPERATIONS COMMAND REPORT\n`;
  csvContent += `Generated At,${timestampStr}\n`;
  csvContent += `Operational Scope,${location}\n`;
  csvContent += `Active Role Scope,${role}\n\n`;

  // Section 1: KPI Metrics
  csvContent += `KEY PERFORMANCE INDICATORS (KPIs)\n`;
  csvContent += `Metric Title,Value,Change vs Prior,Timeframe\n`;
  kpis.forEach((kpi) => {
    csvContent += `"${kpi.title}","${kpi.value}","${kpi.change}","${kpi.timeframe}"\n`;
  });
  csvContent += `\n`;

  // Section 2: High-Priority Exception Queue
  csvContent += `HIGH-PRIORITY EXCEPTION QUEUE (${exceptions.length} Active Alerts)\n`;
  csvContent += `ID,Title,Location,Severity,Action Required,Timestamp\n`;
  exceptions.forEach((exc) => {
    csvContent += `"${exc.id}","${exc.title}","${exc.location}","${exc.severity}","${exc.actionRequired}","${exc.timestamp}"\n`;
  });
  csvContent += `\n`;

  // Section 3: Live Orders Summary
  csvContent += `LIVE ORDER FEED SUMMARY (${orders.length} Orders)\n`;
  csvContent += `Order ID,Customer,Location,Amount (INR),Status,Payment Status\n`;
  orders.forEach((ord) => {
    csvContent += `"${ord.orderNumber}","${ord.customerName}","${ord.warehouseLocation}","${ord.totalAmount}","${ord.status}","${ord.paymentStatus}"\n`;
  });

  // Create Blob & Trigger Browser Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `meet-commerce-hq-report-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
