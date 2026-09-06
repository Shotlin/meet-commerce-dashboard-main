import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, MapPin, Shield, Check, CheckCircle2, ChevronDown, ShoppingBag, Store, Boxes, Warehouse, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../context/ScopeContext';
import { ScopeLocation, UserRole } from '../../types';
import { isRouteAllowed, getPrimaryRouteForRole } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { apiClient } from '../../services/apiClient';
import { ShopSwitcher } from './ShopSwitcher';

export const TopHeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const { role, setRole } = useAuth();
  const { location, setLocation, exceptionCount } = useScope();
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Search State & Refs
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ orders: any[]; vendors: any[]; lots: any[]; receipts: any[] }>({
    orders: [],
    vendors: [],
    lots: [],
    receipts: [],
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  const locations: ScopeLocation[] = [
    'All Hubs (HQ Global)',
    'North Delhi Regional Hub',
    'South Mumbai FC',
    'Bengaluru Central FC',
    'Vendor: MeatCraft Farms',
  ];

  const roles: UserRole[] = [
    'HQ Admin',
    'Warehouse Manager',
    'Vendor',
    'Fulfilment Agent',
    'Finance Lead',
    'Governance Auditor',
  ];

  // Global Search API Handler
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ orders: [], vendors: [], lots: [], receipts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get<any>('/api/v1/search', { q });
        if (res.success && res.data) {
          setSearchResults({
            orders: res.data.orders || [],
            vendors: res.data.vendors || [],
            lots: res.data.lots || [],
            receipts: res.data.receipts || [],
          });
        }
      } catch (err) {
        console.warn('Search API error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Shortcut Ctrl + K or Cmd + K & Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
        setIsNotificationOpen(false);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside handlers for search and notification panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResultsCount =
    searchResults.orders.length +
    searchResults.vendors.length +
    searchResults.lots.length +
    searchResults.receipts.length;

  const handleSelectResult = (basePath: string, term: string) => {
    setIsSearchOpen(false);
    navigate(`${basePath}?q=${encodeURIComponent(term)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);

    if (searchResults.vendors.length > 0) {
      navigate(`/vendors?q=${encodeURIComponent(searchQuery)}`);
    } else if (searchResults.lots.length > 0) {
      navigate(`/inventory?q=${encodeURIComponent(searchQuery)}`);
    } else if (searchResults.receipts.length > 0) {
      navigate(`/warehouse/receiving?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/orders?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleScopeChange = (newScope: ScopeLocation) => {
    setLocation(newScope);
    localStorage.setItem('mc_scope', newScope);
  };

  const locationPath = useLocation().pathname;
  
  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem('mc_role', selectedRole);
    setIsRoleModalOpen(false);

    // If current route is forbidden for the new role, navigate immediately to landing page
    if (!isRouteAllowed(locationPath, selectedRole)) {
      const targetLanding = getPrimaryRouteForRole(selectedRole);
      navigate(targetLanding, { replace: true });
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0">
      {/* Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md relative" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => {
              setIsSearchOpen(true);
              setIsNotificationOpen(false);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search orders, lots, vendors, SKUs, or receipts (Ctrl + K)..."
            className="w-full pl-9 pr-8 py-1.5 text-xs md:text-sm bg-rose-50/50 border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry focus:bg-white text-ink transition-all placeholder:text-status-neutral/60 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-status-neutral hover:text-ink p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Global Search Results Dropdown Popover */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-[12px] shadow-overlay overflow-hidden z-50 max-h-[75vh] overflow-y-auto">
            {totalResultsCount === 0 ? (
              <div className="p-4 text-center text-xs text-status-neutral">
                No matching records found for "<span className="font-semibold text-ink">{searchQuery}</span>"
              </div>
            ) : (
              <div className="p-2 space-y-3 text-xs">
                {/* Orders Category */}
                {searchResults.orders.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-berry flex items-center gap-1.5 bg-rose-50 rounded mb-1">
                      <ShoppingBag className="w-3 h-3" /> Orders ({searchResults.orders.length})
                    </div>
                    {searchResults.orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => handleSelectResult('/orders', ord.orderNumber)}
                        className="p-2 hover:bg-rose-50 rounded-[12px] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-ink font-mono-num">{ord.orderNumber} — {ord.customerName}</p>
                          <p className="text-[11px] text-status-neutral">{ord.warehouseLocation} • {ord.status}</p>
                        </div>
                        <span className="font-mono-num font-bold text-brand-berry">₹{ord.totalAmount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vendors Category */}
                {searchResults.vendors.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-berry flex items-center gap-1.5 bg-rose-50 rounded mb-1">
                      <Store className="w-3 h-3" /> Vendors ({searchResults.vendors.length})
                    </div>
                    {searchResults.vendors.slice(0, 3).map((ven) => (
                      <div
                        key={ven.id}
                        onClick={() => handleSelectResult('/vendors', ven.companyName)}
                        className="p-2 hover:bg-rose-50 rounded-[12px] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-ink">{ven.companyName}</p>
                          <p className="text-[11px] text-status-neutral">{ven.category} • License: {ven.licenseNumber}</p>
                        </div>
                        <span className="text-[10px] font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                          {ven.kycStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inventory Lots Category */}
                {searchResults.lots.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-berry flex items-center gap-1.5 bg-rose-50 rounded mb-1">
                      <Boxes className="w-3 h-3" /> Inventory Lots ({searchResults.lots.length})
                    </div>
                    {searchResults.lots.slice(0, 3).map((lot) => (
                      <div
                        key={lot.id}
                        onClick={() => handleSelectResult('/inventory', lot.lotNumber)}
                        className="p-2 hover:bg-rose-50 rounded-[12px] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-ink">{lot.productName}</p>
                          <p className="text-[11px] text-status-neutral font-mono-num">{lot.lotNumber} • SKU: {lot.sku}</p>
                        </div>
                        <span className="font-mono-num font-bold text-brand-berry">{lot.availableWeightKg} kg</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warehouse Receipts Category */}
                {searchResults.receipts.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-berry flex items-center gap-1.5 bg-rose-50 rounded mb-1">
                      <Warehouse className="w-3 h-3" /> QC Receipts ({searchResults.receipts.length})
                    </div>
                    {searchResults.receipts.slice(0, 3).map((qc) => (
                      <div
                        key={qc.id}
                        onClick={() => handleSelectResult('/warehouse/receiving', qc.receiptNumber)}
                        className="p-2 hover:bg-rose-50 rounded-[12px] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-ink font-mono-num">{qc.receiptNumber} — {qc.vendorName}</p>
                          <p className="text-[11px] text-status-neutral">{qc.categoryName} • Temp: {qc.temperatureCelsius}°C</p>
                        </div>
                        <span className="text-[10px] font-bold text-brand-berry bg-rose-100 px-2 py-0.5 rounded-full">
                          {qc.qcStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Tools: Scope Selector, Role Badge, Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Shop Switcher — real X-Shop-Id scope, distinct from the cosmetic Location Scope Switcher below */}
        <ShopSwitcher />

        {/* Location Scope Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-rose-50 border border-border px-3 py-1.5 rounded-[12px]">
          <MapPin className="w-4 h-4 text-brand-berry shrink-0" />
          <select
            value={location}
            onChange={(e) => handleScopeChange(e.target.value as ScopeLocation)}
            className="bg-transparent text-xs font-bold text-ink focus:outline-none cursor-pointer pr-1"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Role Switcher Trigger Button */}
        <button
          onClick={() => {
            setIsRoleModalOpen(true);
            setIsNotificationOpen(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100/70 hover:bg-rose-100 text-brand-berry border border-brand-berry/20 rounded-[12px] text-xs font-bold transition-colors cursor-pointer"
          title="Change active user role scope"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{role}</span>
          <ChevronDown className="w-3 h-3 ml-0.5" />
        </button>

        {/* Notification Bell Container */}
        <div className="relative" ref={notificationContainerRef}>
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsSearchOpen(false);
            }}
            className="relative p-2 text-status-neutral hover:text-brand-berry hover:bg-rose-50 rounded-[12px] transition-colors cursor-pointer"
            title="HQ Exception Alerts"
          >
            <Bell className="w-5 h-5" />
            {exceptionCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-raspberry rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notification Tray Dropdown Panel */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-[12px] shadow-overlay p-4 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <h4 className="text-xs font-bold text-ink">HQ Exception Queue</h4>
                <span className="text-[10px] font-mono-num bg-rose-100 text-brand-berry font-bold px-2 py-0.5 rounded-full">
                  {exceptionCount} Alerts
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {exceptionCount > 0 ? (
                  <>
                    <div
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/warehouse/receiving');
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100/60 rounded-[12px] border border-border cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-status-danger">Elevated Receiving Temp (6.8°C)</p>
                      <p className="text-[11px] text-status-neutral mt-0.5">South Mumbai FC • Bay 2 — Click to Inspect</p>
                    </div>
                    <div
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate('/orders?q=MC-2026-8842');
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100/60 rounded-[12px] border border-border cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-status-warning">Video Evidence Pending Review</p>
                      <p className="text-[11px] text-status-neutral mt-0.5">Order MC-2026-8842 — Click to Moderating</p>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-status-neutral py-2">No active exceptions in queue</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Switcher Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Switch Role Scope & Permissions"
        subtitle="Test role-gated access control across HQ, Warehouse QC, Vendor, and Governance modules."
        maxWidth="md"
      >
        <div className="space-y-2">
          {roles.map((r) => (
            <div
              key={r}
              onClick={() => handleRoleSelect(r)}
              className={`p-3 rounded-[12px] border flex items-center justify-between cursor-pointer transition-all ${
                role === r
                  ? 'bg-rose-100 border-brand-berry text-brand-berry font-bold'
                  : 'bg-surface border-border hover:bg-rose-50 text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className={`w-4 h-4 ${role === r ? 'text-brand-raspberry' : 'text-status-neutral'}`} />
                <span className="text-sm">{r}</span>
              </div>
              {role === r && <CheckCircle2 className="w-4 h-4 text-brand-raspberry" />}
            </div>
          ))}
        </div>
      </Modal>
    </header>
  );
};
