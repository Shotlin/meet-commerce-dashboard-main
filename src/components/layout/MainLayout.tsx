import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageErrorBoundary } from '../common/PageErrorBoundary';
import { SidebarNav } from './SidebarNav';
import { TopHeaderBar } from './TopHeaderBar';
import { Breadcrumb } from './Breadcrumb';

export const MainLayout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer automatically on navigation — otherwise it stays
  // open (behind the newly-routed page) after a link tap on a phone.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white font-sans text-ink">
      {/* Sidebar Navigation — a fixed off-canvas drawer below the `lg` breakpoint,
          a normal in-flow column at `lg` and up. */}
      <SidebarNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      {/* Backdrop behind the mobile drawer — tapping it closes the menu */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Container with Sticky Header & Independent Scroll Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Sticky Top Header Bar */}
        <TopHeaderBar onOpenMenu={() => setIsMobileNavOpen(true)} />

        {/* Scrollable Main Content Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
          <Breadcrumb />
          <PageErrorBoundary key={location.pathname}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
};
