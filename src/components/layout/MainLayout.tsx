import React, { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';

function HamburgerIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="topbar">
      <button
        className="hamburger-btn btn btn-ghost"
        onClick={onMenuClick}
        style={{ width: 38, padding: 0, justifyContent: 'center', flexShrink: 0 }}
        aria-label="Открыть меню"
      >
        <HamburgerIcon />
      </button>
    </header>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app">
      {/* Overlay backdrop — mobile only */}
      <div
        className={'sidebar-overlay' + (sidebarOpen ? ' open' : '')}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-col">
        <TopBar onMenuClick={openSidebar} />
        <div className="main">
          {children}
        </div>
      </div>
    </div>
  );
}
