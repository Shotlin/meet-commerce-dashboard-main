import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DetailDrawer } from '../layout/DetailDrawer';
import { Badge } from '../common/Badge';
import { Tabs } from '../common/Tabs';
import { queryKeys } from '../../services/queryKeys';
import { shopManagementService, Shop } from '../../services/shopManagementService';

type ShopTab = 'staff' | 'financials' | 'transactions' | 'products';

const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v));

export const ShopDetailDrawer: React.FC<{ shop: Shop | null; onClose: () => void }> = ({ shop, onClose }) => {
  const [tab, setTab] = useState<ShopTab>('financials');
  const shopId = shop?.id ?? null;

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: queryKeys.shops.staff(shopId ?? ''),
    queryFn: () => shopManagementService.getStaff(shopId!),
    enabled: !!shopId && tab === 'staff',
  });

  const { data: financials = [], isLoading: finLoading } = useQuery({
    queryKey: queryKeys.shops.financials(shopId ?? ''),
    queryFn: () => shopManagementService.getFinancials(shopId!),
    enabled: !!shopId && tab === 'financials',
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: queryKeys.shops.transactions(shopId ?? ''),
    queryFn: () => shopManagementService.getTransactions(shopId!),
    enabled: !!shopId && tab === 'transactions',
  });

  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: queryKeys.shops.products(shopId ?? ''),
    queryFn: () => shopManagementService.getProducts(shopId!),
    enabled: !!shopId && tab === 'products',
  });

  return (
    <DetailDrawer isOpen={!!shop} onClose={onClose} title={shop?.name ?? 'Shop'} subtitle={shop ? `${shop.branch_code} · ${shop.city}, ${shop.state}` : undefined} width="xl">
      {shop && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
              <p className="text-[10px] font-bold text-status-neutral uppercase">Total Orders</p>
              <p className="font-mono-num font-bold text-ink">{shop.total_orders}</p>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
              <p className="text-[10px] font-bold text-status-neutral uppercase">Total Revenue</p>
              <p className="font-mono-num font-bold text-brand-berry">₹{num(shop.total_revenue).toFixed(2)}</p>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border">
              <p className="text-[10px] font-bold text-status-neutral uppercase">Commission</p>
              <p className="font-mono-num font-bold text-ink">{num(shop.commission_rate).toFixed(1)}%</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant={shop.is_active ? 'success' : 'neutral'}>{shop.is_active ? 'Active' : 'Inactive'}</Badge>
            <Badge variant={shop.is_verified ? 'info' : 'warning'}>{shop.is_verified ? 'Verified' : 'Unverified'}</Badge>
          </div>

          <Tabs
            tabs={[
              { id: 'staff', label: 'Staff' },
              { id: 'financials', label: 'Financials' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'products', label: 'Products' },
            ]}
            activeTab={tab}
            onChange={(id) => setTab(id as ShopTab)}
          />

          {tab === 'staff' && (
            <div className="space-y-2">
              {staffLoading ? <p className="text-xs text-status-neutral">Loading…</p> : staff.length === 0 ? <p className="text-xs text-status-neutral">No staff assigned yet.</p> : staff.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                  <div>
                    <p className="font-bold text-ink">{s.user_name ?? 'Unknown'}</p>
                    <p className="text-[11px] text-status-neutral">{s.user_email ?? s.user_phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" size="sm">{s.role}</Badge>
                    <p className="text-[10px] text-status-neutral mt-0.5">{s.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'financials' && (
            <div className="space-y-2">
              {finLoading ? <p className="text-xs text-status-neutral">Loading…</p> : financials.length === 0 ? <p className="text-xs text-status-neutral">No financial periods recorded yet.</p> : financials.map((f) => (
                <div key={f.id} className="p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-ink">{f.period_type} · {new Date(f.period_start).toLocaleDateString('en-IN')} – {new Date(f.period_end).toLocaleDateString('en-IN')}</p>
                    <Badge variant={f.payout_status === 'PAID' ? 'success' : 'warning'} size="sm">{f.payout_status}</Badge>
                  </div>
                  <div className="flex justify-between mt-1.5 font-mono-num">
                    <span className="text-status-neutral">Gross ₹{num(f.gross_revenue).toFixed(2)}</span>
                    <span className="font-bold text-brand-berry">Payout ₹{num(f.payout_amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'transactions' && (
            <div className="space-y-2">
              {txLoading ? <p className="text-xs text-status-neutral">Loading…</p> : transactions.length === 0 ? <p className="text-xs text-status-neutral">No transactions yet.</p> : transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                  <div>
                    <p className="font-bold text-ink">{t.type.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-status-neutral">{new Date(t.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`font-mono-num font-bold ${t.direction === 'CREDIT' ? 'text-status-success' : 'text-status-danger'}`}>
                    {t.direction === 'CREDIT' ? '+' : '-'}₹{num(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-2">
              {prodLoading ? <p className="text-xs text-status-neutral">Loading…</p> : products.length === 0 ? <p className="text-xs text-status-neutral">No products listed yet.</p> : products.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-rose-50/60 rounded-[10px] border border-border text-xs">
                  <div>
                    <p className="font-bold text-ink">{p.product.name ?? 'Unknown Product'}</p>
                    <p className="text-[11px] text-status-neutral">{p.product.category_name} · Stock: {p.stock_quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num font-bold text-brand-berry">₹{num(p.sale_price ?? p.price).toFixed(2)}</p>
                    <Badge variant={p.is_available ? 'success' : 'neutral'} size="sm">{p.is_available ? 'Available' : 'Unavailable'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
};
