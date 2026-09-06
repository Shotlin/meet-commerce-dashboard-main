import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap: Record<string, string> = {
    orders: 'Orders & Evidence',
    warehouse: 'Warehouse Operations',
    receiving: 'QC Receiving',
    inventory: 'Inventory Ledger & Lots',
    vendors: 'Vendors & Procurement',
    finance: 'Finance Overview',
    analytics: 'Analytics & Reports',
    catalogue: 'Catalogue Management',
    fulfilment: 'Fulfilment & Packing',
    delivery: 'Delivery Command',
    crm: 'CRM & Customers',
    support: 'Support Inbox',
    recalls: 'Quality & Recalls',
    marketing: 'Marketing Campaigns',
    content: 'Content Builder',
    loyalty: 'Loyalty Program',
    traceability: 'Traceability Lineage',
    governance: 'Governance Audit',
    retention: 'Retention & Comms',
    platform: 'Platform Operations',
    merchandising: 'Merchandising Rules',
    shops: 'Shops & Staff',
    configuration: 'Commerce Settings',
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-status-neutral mb-3 select-none">
      <Link to="/" className="flex items-center hover:text-brand-berry transition-colors">
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>HQ Command</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[name] || name;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
            {isLast ? (
              <span className="font-bold text-ink truncate">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-brand-berry transition-colors truncate">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
