import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, RoleRoute } from './components/auth/ProtectedRoute';

// Core Pages
const HQCommandCenter = lazy(() => import('./pages/HQCommandCenter').then((m) => ({ default: m.HQCommandCenter })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const VendorsPage = lazy(() => import('./pages/VendorsPage').then((m) => ({ default: m.VendorsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const FinancePage = lazy(() => import('./pages/FinancePage').then((m) => ({ default: m.FinancePage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const BusinessOverviewPage = lazy(() => import('./pages/BusinessOverviewPage').then((m) => ({ default: m.BusinessOverviewPage })));

// Additional Feature Pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const BulkImportPage = lazy(() => import('./pages/BulkImportPage'));
const ProductFamiliesPage = lazy(() => import('./pages/ProductFamiliesPage'));
const ProductFamilyDetailPage = lazy(() => import('./pages/ProductFamilyDetailPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const RidersPage = lazy(() => import('./pages/RidersPage').then((m) => ({ default: m.RidersPage })));
const DeliveryPage = lazy(() => import('./pages/DeliveryPage').then((m) => ({ default: m.DeliveryPage })));
const CRMPage = lazy(() => import('./pages/CRMPage').then((m) => ({ default: m.CRMPage })));
const CustomerActivityPage = lazy(() => import('./pages/CustomerActivityPage'));
const FirstTimeOffersPage = lazy(() => import('./pages/FirstTimeOffersPage'));
const CustomerSegmentsPage = lazy(() => import('./pages/CustomerSegmentsPage').then((m) => ({ default: m.CustomerSegmentsPage })));
const CartMilestonesPage = lazy(() => import('./pages/CartMilestonesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage })));
const RecallsPage = lazy(() => import('./pages/RecallsPage').then((m) => ({ default: m.RecallsPage })));
const MarketingPage = lazy(() => import('./pages/MarketingPage').then((m) => ({ default: m.MarketingPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then((m) => ({ default: m.ContentPage })));
const ThemeLibraryPage = lazy(() => import('./pages/ThemeLibraryPage'));
const NewThemePage = lazy(() => import('./pages/NewThemePage'));
const EditThemePage = lazy(() => import('./pages/EditThemePage'));
const ThemeBuilderPage = lazy(() => import('./pages/ThemeBuilderPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage').then((m) => ({ default: m.LoyaltyPage })));
const GovernancePage = lazy(() => import('./pages/GovernancePage').then((m) => ({ default: m.GovernancePage })));
const RetentionPage = lazy(() => import('./pages/RetentionPage').then((m) => ({ default: m.RetentionPage })));
const AbandonedCartsPage = lazy(() => import('./pages/AbandonedCartsPage'));
const PlatformPage = lazy(() => import('./pages/PlatformPage').then((m) => ({ default: m.PlatformPage })));
const MerchandisingPage = lazy(() => import('./pages/MerchandisingPage').then((m) => ({ default: m.MerchandisingPage })));
const ShopsPage = lazy(() => import('./pages/ShopsPage').then((m) => ({ default: m.ShopsPage })));
const CoverageMapPage = lazy(() => import('./pages/CoverageMapPage').then((m) => ({ default: m.CoverageMapPage })));
const StoreDetailPage = lazy(() => import('./pages/StoreDetailPage').then((m) => ({ default: m.StoreDetailPage })));
const ProcurementPage = lazy(() => import('./pages/ProcurementPage'));
const ProcurementCreatePage = lazy(() => import('./pages/ProcurementCreatePage'));
const InHousePurchaseCreatePage = lazy(() => import('./pages/InHousePurchaseCreatePage'));
const ProcurementDetailPage = lazy(() => import('./pages/ProcurementDetailPage'));
const SupplyOrdersPage = lazy(() => import('./pages/SupplyOrdersPage'));
const SupplyOrderDetailPage = lazy(() => import('./pages/SupplyOrderDetailPage'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage').then((m) => ({ default: m.ConfigurationPage })));
const MapsSettingsPage = lazy(() => import('./pages/MapsSettingsPage'));
const RazorpaySettingsPage = lazy(() => import('./pages/RazorpaySettingsPage'));
const ShiprocketSettingsPage = lazy(() => import('./pages/ShiprocketSettingsPage'));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage'));
const WhatsAppInboxPage = lazy(() => import('./pages/WhatsAppInboxPage'));
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Session gate → layout → role gate. Nothing (not even the sidebar)
                renders unless the session is verified. */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route element={<RoleRoute />}>
                  {/* Core Modules */}
                  <Route index element={<HQCommandCenter />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="vendors" element={<VendorsPage />} />
                  <Route path="procurement" element={<ProcurementPage />} />
                  <Route path="procurement/new" element={<ProcurementCreatePage />} />
                  <Route path="procurement/in-house/new" element={<InHousePurchaseCreatePage />} />
                  <Route path="procurement/supplies" element={<SupplyOrdersPage />} />
                  <Route path="procurement/supplies/:supplyId" element={<SupplyOrderDetailPage />} />
                  <Route path="procurement/:id" element={<ProcurementDetailPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="overview" element={<BusinessOverviewPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />

                  {/* Full Route Architecture Modules */}
                  <Route path="catalogue" element={<ProductsPage />} />
                  <Route path="products/bulk-import" element={<BulkImportPage />} />
                  <Route path="products/families" element={<ProductFamiliesPage />} />
                  <Route path="products/families/:id" element={<ProductFamilyDetailPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="delivery" element={<DeliveryPage />} />
                  <Route path="riders" element={<RidersPage />} />
                  <Route path="crm" element={<CRMPage />} />
                  {/* Alias so `/customers?customer=<uuid>` deep-links (from
                      the Order Detail Drawer's Customer section) resolve to
                      the same CRM/customer experience — `/crm` keeps working
                      unchanged for existing links/bookmarks. */}
                  <Route path="customers" element={<CRMPage />} />
                  <Route path="customer-activity" element={<CustomerActivityPage />} />
                  <Route path="first-time-offers" element={<FirstTimeOffersPage />} />
                  <Route path="customer-segments" element={<CustomerSegmentsPage />} />
                  <Route path="cart-milestones" element={<CartMilestonesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="returns" element={<ReturnsPage />} />
                  <Route path="recalls" element={<RecallsPage />} />
                  <Route path="marketing" element={<MarketingPage />} />
                  <Route path="content" element={<ContentPage />} />
                  <Route path="themes" element={<ThemeLibraryPage />} />
                  <Route path="themes/new" element={<NewThemePage />} />
                  <Route path="themes/builder" element={<ThemeBuilderPage />} />
                  <Route path="themes/:id" element={<EditThemePage />} />
                  <Route path="loyalty" element={<LoyaltyPage />} />
                  <Route path="governance" element={<GovernancePage />} />
                  <Route path="retention" element={<RetentionPage />} />
                  <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
                  <Route path="platform" element={<PlatformPage />} />
                  <Route path="merchandising" element={<MerchandisingPage />} />
                  <Route path="shops" element={<ShopsPage />} />
                  <Route path="coverage-map" element={<CoverageMapPage />} />
                  <Route path="shops/:id" element={<StoreDetailPage />} />
                  <Route path="configuration" element={<ConfigurationPage />} />
                  <Route path="configuration/maps" element={<MapsSettingsPage />} />
                  <Route path="configuration/razorpay" element={<RazorpaySettingsPage />} />
                  <Route path="configuration/shiprocket" element={<ShiprocketSettingsPage />} />
                  <Route path="whatsapp" element={<WhatsAppPage />} />
                  <Route path="whatsapp/inbox" element={<WhatsAppInboxPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
