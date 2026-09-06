import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Boxes,
  Warehouse,
  Truck,
  Users,
  LifeBuoy,
  RotateCcw,
  ShieldCheck,
  IndianRupee,
  Gift,
  Megaphone,
  Palette,
  LayoutTemplate,
  BarChart3,
  GitBranch,
  Shield,
  Send,
  Sliders,
  Settings,
  Flame,
  Lock,
  User,
  Key,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  ShoppingCart,
  History,
  Bell,
  Tags
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useScope } from '../../context/ScopeContext';
import { isRouteAllowed } from '../../utils/permissions';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  isCore?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const SidebarNav: React.FC = () => {
  const { role, userName, userEmail, userPhone, userDesignation, updateProfile } = useAuth();
  const { qcHeldCount, pendingOrdersCount, supportTicketsCount, exceptionCount } = useScope();

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const groups: NavGroup[] = [
    {
      title: 'OPERATIONS CORE',
      items: [
        { to: '/', label: 'HQ Command', icon: <LayoutDashboard className="w-4 h-4" />, isCore: true },
        { to: '/orders', label: 'Orders & Evidence', icon: <ShoppingBag className="w-4 h-4" />, badge: pendingOrdersCount, isCore: true },
        { to: '/warehouse/receiving', label: 'Warehouse QC', icon: <Warehouse className="w-4 h-4" />, badge: qcHeldCount, isCore: true },
        { to: '/inventory', label: 'Inventory & Lots', icon: <Boxes className="w-4 h-4" />, isCore: true },
        { to: '/vendors', label: 'Vendors & Procurement', icon: <Store className="w-4 h-4" />, isCore: true },
        { to: '/finance', label: 'Finance & Payouts', icon: <IndianRupee className="w-4 h-4" />, isCore: true },
        { to: '/analytics', label: 'Analytics & Reports', icon: <BarChart3 className="w-4 h-4" />, isCore: true },
      ],
    },
    {
      title: 'SUPPLY & LOGISTICS',
      items: [
        { to: '/catalogue', label: 'Products', icon: <Boxes className="w-4 h-4" /> },
        { to: '/categories', label: 'Categories', icon: <Tags className="w-4 h-4" /> },
        { to: '/fulfilment', label: 'Fulfilment Waves', icon: <Boxes className="w-4 h-4" /> },
        { to: '/delivery', label: 'Riders & Dispatch', icon: <Truck className="w-4 h-4" /> },
        { to: '/shops', label: 'Shops & Warehouses', icon: <Store className="w-4 h-4" /> },
      ],
    },
    {
      title: 'CUSTOMER & QUALITY',
      items: [
        { to: '/crm', label: 'Customer Accounts', icon: <Users className="w-4 h-4" /> },
        { to: '/customer-activity', label: 'Customer Activity', icon: <History className="w-4 h-4" /> },
        { to: '/support', label: 'Support Desk Inbox', icon: <LifeBuoy className="w-4 h-4" />, badge: supportTicketsCount },
        { to: '/returns', label: 'Returns & Refunds', icon: <RotateCcw className="w-4 h-4" /> },
        { to: '/recalls', label: 'Quality & Recalls', icon: <ShieldCheck className="w-4 h-4" />, badge: exceptionCount },
      ],
    },
    {
      title: 'GROWTH & CONTENT',
      items: [
        { to: '/marketing', label: 'Campaigns & Coupons', icon: <Megaphone className="w-4 h-4" /> },
        { to: '/content', label: 'Banners', icon: <Palette className="w-4 h-4" /> },
        { to: '/themes', label: 'Theme Builder', icon: <LayoutTemplate className="w-4 h-4" /> },
        { to: '/theme-tabs', label: 'Theme Tabs', icon: <LayoutTemplate className="w-4 h-4" /> },
        { to: '/loyalty', label: 'Wallet & Loyalty', icon: <Gift className="w-4 h-4" /> },
        { to: '/merchandising', label: 'Merchandising Hierarchy', icon: <Sliders className="w-4 h-4" /> },
        { to: '/first-time-offers', label: 'First-Time Offers', icon: <Gift className="w-4 h-4" /> },
        { to: '/cart-milestones', label: 'Cart Milestones', icon: <Sliders className="w-4 h-4" /> },
        { to: '/customer-segments', label: 'Customer Segments', icon: <Users className="w-4 h-4" /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYSTEM & PLATFORM',
      items: [
        { to: '/traceability', label: 'Chain of Custody', icon: <GitBranch className="w-4 h-4" /> },
        { to: '/governance', label: 'Governance & Auditing', icon: <Shield className="w-4 h-4" /> },
        { to: '/retention', label: 'Retention Engine', icon: <Send className="w-4 h-4" /> },
        { to: '/abandoned-carts', label: 'Abandoned Carts', icon: <ShoppingCart className="w-4 h-4" /> },
        { to: '/platform', label: 'Platform & Flags', icon: <Settings className="w-4 h-4" /> },
        { to: '/configuration', label: 'Commerce Config', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const normalizeAndValidatePhone = (phoneInput: string) => {
    let raw = phoneInput.trim();
    if (!raw) return { isValid: true, normalizedPhone: '' };

    // Remove spaces, hyphens, brackets
    let cleaned = raw.replace(/[\s\-\(\)]/g, '');

    // Strip +91, 91 (when 12 digits), or leading 0 (when 11 digits)
    if (cleaned.startsWith('+91')) {
      cleaned = cleaned.slice(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }

    // Validate national number: exactly 10 digits starting with 6, 7, 8, or 9
    const isValid = /^[6-9]\d{9}$/.test(cleaned);
    return { isValid, normalizedPhone: cleaned };
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const rawPhone = editPhone.trim();
    let finalPhone = '';

    if (rawPhone) {
      const { isValid, normalizedPhone } = normalizeAndValidatePhone(rawPhone);
      if (!isValid) {
        setPhoneError('Please enter a valid 10-digit contact number.');
        return;
      }
      finalPhone = normalizedPhone;
    }

    updateProfile(editName.trim(), editEmail.trim(), finalPhone);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsProfileModalOpen(false);
    }, 1200);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-white/10 text-rose-100 flex flex-col shrink-0 h-screen sticky top-0 overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[12px] bg-gradient-to-br from-brand-raspberry to-brand-berry flex items-center justify-center text-white shrink-0 shadow-xs">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1 truncate">
            <h1 className="font-bold text-white text-sm tracking-tight leading-none truncate">MEET COMMERCE</h1>
            <p className="text-[10px] text-rose-200 font-semibold mt-0.5 tracking-wider truncate">ENTERPRISE HQ</p>
          </div>
        </div>
        <span className="text-[10px] bg-rose-100/20 text-white font-mono-num font-bold px-2 py-0.5 rounded-full border border-rose-100/30 shrink-0">
          v2.4
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-rose-200/90 uppercase truncate">
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const allowed = isRouteAllowed(item.to, role);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3 py-2 rounded-[12px] text-xs font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-gradient-to-r from-brand-raspberry to-brand-berry text-white shadow-xs font-bold'
                          : 'text-rose-100 hover:text-white hover:bg-white/10',
                        !allowed && 'opacity-50 cursor-not-allowed'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {!allowed && (
                        <span title="Restricted for current role">
                          <Lock className="w-3 h-3 text-status-warning shrink-0" />
                        </span>
                      )}
                      {item.badge !== undefined && (
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-mono-num font-bold shrink-0',
                            typeof item.badge === 'number'
                              ? 'bg-rose-100 text-brand-berry'
                              : 'bg-status-warning text-ink'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile Mini Card - Strict Overflow Defense */}
      <div
        onClick={() => {
          setEditName(userName);
          setEditEmail(userEmail);
          setEditPhone(userPhone);
          setPhoneError(null);
          setIsProfileModalOpen(true);
        }}
        className="p-3 border-t border-white/10 bg-black/20 text-xs shrink-0 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden"
        title="Click to view and edit user profile & security credentials"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-raspberry to-brand-berry text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-bold text-white text-xs truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-rose-100 font-medium truncate leading-tight mt-0.5">{userEmail}</p>
            </div>
          </div>
          <Badge variant="brand" className="text-[9px] px-1.5 py-0.5 shrink-0 max-w-[80px] truncate">
            {role}
          </Badge>
        </div>
      </div>

      {/* User Profile & Security Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="User Profile & Security Settings"
        subtitle="Manage administrative identity, contact details, role scope, and session security credentials."
        maxWidth="md"
      >
        <form onSubmit={handleProfileSave} className="space-y-4 max-w-full overflow-hidden">
          {saveSuccess && (
            <div className="p-3 bg-status-success/10 border border-status-success text-status-success rounded-[12px] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile parameters successfully updated and saved.
            </div>
          )}

          {/* Profile Header Summary Card */}
          <div className="p-3 bg-rose-50 border border-border rounded-[12px] flex items-center justify-between gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-brand-berry text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                {getInitials(editName)}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="font-bold text-ink text-sm truncate">{userName}</p>
                <p className="text-xs text-status-neutral truncate">{userDesignation}</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-brand-berry text-white px-2.5 py-1 rounded-full shrink-0 truncate max-w-[100px]">
              {role}
            </span>
          </div>

          <div className="space-y-3 text-xs max-w-full">
            <div>
              <label className="block font-bold text-ink mb-1">Full Legal Name</label>
              <div className="relative max-w-full">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral shrink-0" />
                <input
                  type="text"
                  value={editName}
                  maxLength={60}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full max-w-full box-border min-w-0 pl-9 pr-3 py-2 bg-white border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry text-ink font-semibold text-xs overflow-hidden truncate"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Enterprise Email Address</label>
              <div className="relative max-w-full">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-status-neutral shrink-0" />
                <input
                  type="email"
                  value={editEmail}
                  maxLength={80}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full max-w-full box-border min-w-0 pl-9 pr-3 py-2 bg-white border border-border rounded-[12px] focus:outline-none focus:border-brand-raspberry text-ink font-semibold text-xs overflow-hidden truncate"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-ink">Contact Phone Number</label>
                <span className="text-[10px] text-status-neutral font-medium">Example: 7013352181</span>
              </div>
              <div className="relative max-w-full">
                <Phone className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 shrink-0 ${phoneError ? 'text-status-danger' : 'text-status-neutral'}`} />
                <input
                  type="tel"
                  inputMode="tel"
                  value={editPhone}
                  maxLength={20}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="7013352181"
                  className={clsx(
                    'w-full max-w-full box-border min-w-0 pl-9 pr-3 py-2 bg-white border rounded-[12px] focus:outline-none font-semibold text-xs overflow-hidden truncate transition-colors',
                    phoneError
                      ? 'border-status-danger text-status-danger focus:border-status-danger bg-status-danger/5'
                      : 'border-border focus:border-brand-raspberry text-ink'
                  )}
                />
              </div>
              {phoneError && (
                <p className="mt-1.5 text-[11px] font-bold text-status-danger flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>

            <div className="p-3 bg-rose-50/70 border border-border rounded-[12px] space-y-2 overflow-hidden">
              <div className="flex items-center justify-between text-xs gap-2 min-w-0">
                <span className="font-bold text-ink flex items-center gap-1.5 min-w-0 truncate">
                  <Key className="w-3.5 h-3.5 text-brand-berry shrink-0" /> Security Status
                </span>
                <span className="font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full shrink-0 text-[10px]">
                  MFA 2FA Active
                </span>
              </div>
              <p className="text-[11px] text-status-neutral leading-normal">
                Hardware token MFA is active. Session authenticated with Fastify JWT on backend origin `http://localhost:4500`.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Profile Updates
            </Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};
