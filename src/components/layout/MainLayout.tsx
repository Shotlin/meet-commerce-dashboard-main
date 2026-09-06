import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { TopHeaderBar } from './TopHeaderBar';
import { Breadcrumb } from './Breadcrumb';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white font-sans text-ink">
      {/* Fixed Full-Height Sidebar Navigation */}
      <SidebarNav />

      {/* Main Container with Sticky Header & Independent Scroll Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Sticky Top Header Bar */}
        <TopHeaderBar />

        {/* Scrollable Main Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
