import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScopeProvider } from './context/ScopeContext';
import { ShopScopeProvider } from './context/ShopScopeContext';
import { StoreProvider } from './contexts/StoreContext';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Core Pages
import { HQCommandCenter } from './pages/HQCommandCenter';
import { OrdersPage } from './pages/OrdersPage';
import { VendorsPage } from './pages/VendorsPage';
import { InventoryPage } from './pages/InventoryPage';
import { WarehouseQCPage } from './pages/WarehouseQCPage';
import { FinancePage } from './pages/FinancePage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Additional Feature Pages
import ProductsPage from './pages/ProductsPage';
import ProductFamiliesPage from './pages/ProductFamiliesPage';
import ProductFamilyDetailPage from './pages/ProductFamilyDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import { FulfilmentPage } from './pages/FulfilmentPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { CRMPage } from './pages/CRMPage';
import CustomerActivityPage from './pages/CustomerActivityPage';
import FirstTimeOffersPage from './pages/FirstTimeOffersPage';
import { CustomerSegmentsPage } from './pages/CustomerSegmentsPage';
import CartMilestonesPage from './pages/CartMilestonesPage';
import NotificationsPage from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { RecallsPage } from './pages/RecallsPage';
import { MarketingPage } from './pages/MarketingPage';
import { ContentPage } from './pages/ContentPage';
import ThemeLibraryPage from './pages/ThemeLibraryPage';
import NewThemePage from './pages/NewThemePage';
import EditThemePage from './pages/EditThemePage';
import ThemeBuilderPage from './pages/ThemeBuilderPage';
import ThemeTabsManagementPage from './pages/ThemeTabsManagementPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { GovernancePage } from './pages/GovernancePage';
import { RetentionPage } from './pages/RetentionPage';
import AbandonedCartsPage from './pages/AbandonedCartsPage';
import { PlatformPage } from './pages/PlatformPage';
import { MerchandisingPage } from './pages/MerchandisingPage';
import { ShopsPage } from './pages/ShopsPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import MapsSettingsPage from './pages/MapsSettingsPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ScopeProvider>
        <ShopScopeProvider>
        <StoreProvider>
        <Toaster position="top-right" richColors closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<MainLayout />}>
              <Route element={<ProtectedRoute />}>
                {/* Core Modules */}
                <Route index element={<HQCommandCenter />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="warehouse/receiving" element={<WarehouseQCPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />

                {/* Full Route Architecture Modules */}
                <Route path="catalogue" element={<ProductsPage />} />
                <Route path="products/families" element={<ProductFamiliesPage />} />
                <Route path="products/families/:id" element={<ProductFamilyDetailPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="fulfilment" element={<FulfilmentPage />} />
                <Route path="delivery" element={<DeliveryPage />} />
                <Route path="crm" element={<CRMPage />} />
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
                <Route path="theme-tabs" element={<ThemeTabsManagementPage />} />
                <Route path="loyalty" element={<LoyaltyPage />} />
                <Route path="traceability" element={<TraceabilityPage />} />
                <Route path="governance" element={<GovernancePage />} />
                <Route path="retention" element={<RetentionPage />} />
                <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
                <Route path="platform" element={<PlatformPage />} />
                <Route path="merchandising" element={<MerchandisingPage />} />
                <Route path="shops" element={<ShopsPage />} />
                <Route path="shops/:id" element={<StoreDetailPage />} />
                <Route path="configuration" element={<ConfigurationPage />} />
                <Route path="configuration/maps" element={<MapsSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </StoreProvider>
        </ShopScopeProvider>
      </ScopeProvider>
    </AuthProvider>
  );
};

export default App;
