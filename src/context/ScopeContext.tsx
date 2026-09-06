import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScopeLocation } from '../types';
import { warehouseService } from '../services/warehouseService';
import { orderService } from '../services/orderService';
import { supportService } from '../services/supportService';

interface ScopeContextType {
  location: ScopeLocation;
  setLocation: (location: ScopeLocation) => void;
  exceptionCount: number;
  setExceptionCount: React.Dispatch<React.SetStateAction<number>>;
  qcHeldCount: number;
  setQcHeldCount: React.Dispatch<React.SetStateAction<number>>;
  pendingOrdersCount: number;
  setPendingOrdersCount: React.Dispatch<React.SetStateAction<number>>;
  supportTicketsCount: number;
  setSupportTicketsCount: React.Dispatch<React.SetStateAction<number>>;
  refreshGlobalCounts: () => Promise<void>;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<ScopeLocation>('All Hubs (HQ Global)');
  const [exceptionCount, setExceptionCount] = useState<number>(2);
  const [qcHeldCount, setQcHeldCount] = useState<number>(1);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(2);
  const [supportTicketsCount, setSupportTicketsCount] = useState<number>(2);

  const refreshGlobalCounts = async () => {
    try {
      const [receipts, ordersArr, ticketsArr, recallsArr] = await Promise.all([
        warehouseService.getQCReceipts().catch(() => []),
        orderService.getOrders().catch(() => []),
        supportService.getTickets().catch(() => []),
        supportService.getRecalls().catch(() => []),
      ]);

      // Count held/pending receipts for active scope
      const held = receipts.filter(r => {
        const matchesScope = location === 'All Hubs (HQ Global)' || r.vendorName.toLowerCase().includes(location.split(' ')[0].toLowerCase());
        const isHeld = r.qcStatus === 'Pending QC' || r.qcStatus === 'Quarantined';
        return matchesScope && isHeld;
      }).length;

      const pendingOrders = ordersArr.filter(o => {
        const matchesScope = location === 'All Hubs (HQ Global)' || o.warehouseLocation.toLowerCase().includes(location.split(' ')[0].toLowerCase());
        return matchesScope && (o.status === 'In QC' || o.status === 'Cutting Completed' || o.status === 'Pending');
      }).length;

      const openTickets = ticketsArr.filter(t => t.status === 'Open' || t.status === 'Escalated' || t.status === 'In Progress').length;
      const activeRecalls = recallsArr.filter(r => r.status === 'Active' || r.severity === 'High').length;

      setQcHeldCount(held);
      setPendingOrdersCount(pendingOrders);
      setSupportTicketsCount(openTickets);
      setExceptionCount(activeRecalls);
    } catch (err) {
      console.warn('[ScopeContext] Refresh global counts warning:', err);
    }
  };

  useEffect(() => {
    refreshGlobalCounts();
  }, [location]);

  return (
    <ScopeContext.Provider
      value={{
        location,
        setLocation,
        exceptionCount,
        setExceptionCount,
        qcHeldCount,
        setQcHeldCount,
        pendingOrdersCount,
        setPendingOrdersCount,
        supportTicketsCount,
        setSupportTicketsCount,
        refreshGlobalCounts,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};
