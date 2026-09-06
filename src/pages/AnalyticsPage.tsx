import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { analyticsService, ReportsSummary } from '../services/analyticsService';
import { BarChart3, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await analyticsService.getReportsSummary();
      setData(summary);
    } catch (err: any) {
      console.error('[AnalyticsPage] API error:', err);
      setError(err.message || 'Unable to fetch analytics report data from API (http://localhost:4500)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExecutivePDF = () => {
    if (isExporting || !data) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toISOString().split('T')[0];

      doc.setFontSize(16);
      doc.setTextColor(53, 18, 38);
      doc.text('MEET COMMERCE EXECUTIVE ANALYTICS REPORT', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(102, 112, 133);
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 28);
      doc.text('Source: Fastify API /api/v1/reports/summary', 14, 34);

      doc.setDrawColor(241, 215, 225);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(12);
      doc.setTextColor(157, 23, 77);
      doc.text('1. Category Revenue & Order Demand Mix', 14, 48);

      doc.setFontSize(9);
      doc.setTextColor(53, 18, 38);
      let y = 56;
      doc.text('Category Name', 14, y);
      doc.text('Orders', 110, y);
      doc.text('Gross Revenue (INR)', 150, y);
      doc.line(14, y + 2, 196, y + 2);

      data.categoryDemand.forEach((item) => {
        y += 8;
        doc.text(item.category, 14, y);
        doc.text(String(item.orders), 110, y);
        doc.text(`Rs. ${item.revenue.toLocaleString('en-IN')}`, 150, y);
      });

      y += 16;
      doc.setFontSize(12);
      doc.setTextColor(157, 23, 77);
      doc.text('2. Customer Cohort Retention Curve (%)', 14, y);

      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(53, 18, 38);
      doc.text('Cohort Period', 14, y);
      doc.text('Retention Percentage', 110, y);
      doc.line(14, y + 2, 196, y + 2);

      data.cohortRetention.forEach((item) => {
        y += 8;
        doc.text(item.month, 14, y);
        doc.text(`${item.retentionPct}%`, 110, y);
      });

      doc.save(`meet-commerce-executive-report-${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-berry animate-spin mx-auto" />
        <p className="text-xs font-bold text-ink">Fetching Analytics & Executive Intelligence API (/api/v1/reports/summary)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-status-danger/10 border border-status-danger/30 rounded-[12px] text-center space-y-3 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
        <h3 className="text-sm font-bold text-ink">Unable to Load Analytics Data</h3>
        <p className="text-xs text-status-neutral">{error}</p>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAnalyticsData}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics & Executive Intelligence"
        subtitle="Category demand mix, customer cohort retention, quality metrics, and regional revenue forecasts."
        badge={<Badge variant="brand" icon={<BarChart3 className="w-3.5 h-3.5" />}>Live API Reports</Badge>}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAnalyticsData}>
              Refresh API
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />}
              onClick={handleExportExecutivePDF}
              disabled={isExporting}
            >
              {isExporting ? 'Generating PDF...' : 'Export Executive PDF'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Mix Bar Chart */}
        <Card title="Category Revenue & Order Demand Mix">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.categoryDemand || []}>
                <XAxis dataKey="category" stroke="#667085" fontSize={11} />
                <YAxis stroke="#667085" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#E31E64" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Cohort Retention Curve (%) Chart */}
        <Card title="Customer Cohort Retention Curve (%)">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.cohortRetention || []} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="month" stroke="#667085" fontSize={11} padding={{ left: 20, right: 20 }} />
                <YAxis
                  stroke="#667085"
                  fontSize={11}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Retention Rate']} />
                <Line
                  type="monotone"
                  dataKey="retentionPct"
                  stroke="#179B73"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#179B73' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
