import React, { createContext, useContext, useEffect, useState } from 'react';
import { shopManagementService, Shop } from '../services/shopManagementService';
import { getActiveShopId, setActiveShopId as setApiClientActiveShopId } from '../services/apiClient';

interface ShopScopeContextType {
  shops: Shop[];
  isLoading: boolean;
  /** null = HQ-wide (no shop scope); every X-Shop-Id-aware request is unscoped. */
  activeShopId: string | null;
  activeShop: Shop | null;
  setActiveShop: (shop: Shop | null) => void;
  refreshShops: () => Promise<void>;
}

const ShopScopeContext = createContext<ShopScopeContextType | undefined>(undefined);

export const ShopScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShopId, setActiveShopIdState] = useState<string | null>(() => getActiveShopId());

  const refreshShops = async () => {
    setIsLoading(true);
    try {
      const list = await shopManagementService.getShops();
      setShops(list);
    } catch (err) {
      console.warn('[ShopScopeContext] Failed to fetch shops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshShops();
  }, []);

  const setActiveShop = (shop: Shop | null) => {
    const id = shop?.id ?? null;
    setApiClientActiveShopId(id);
    setActiveShopIdState(id);
  };

  const activeShop = shops.find((s) => s.id === activeShopId) ?? null;

  return (
    <ShopScopeContext.Provider
      value={{ shops, isLoading, activeShopId, activeShop, setActiveShop, refreshShops }}
    >
      {children}
    </ShopScopeContext.Provider>
  );
};

export const useShopScope = () => {
  const context = useContext(ShopScopeContext);
  if (!context) {
    throw new Error('useShopScope must be used within a ShopScopeProvider');
  }
  return context;
};
