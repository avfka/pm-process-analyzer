import React, { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'wouter';

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
      {/* Hamburger — mobile only */}
      <button
        className="hamburger-btn btn btn-ghost"
        onClick={onMenuClick}
        style={{ width: 38, padding: 0, justifyContent: 'center', flexShrink: 0 }}
        aria-label="Открыть меню"
      >
        <HamburgerIcon />
      </button>

      {/* Search bar — hidden on mobile via .topbar-search */}
      <div className="topbar-search search-bar" style={{ minWidth: 280, maxWidth: 380, flex: 1 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>
        </svg>
        <input placeholder="Найти процесс, кейс или активность…" />
        <span className="pill pill-ghost" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg)' }}>⌘ K</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Live pill — hidden on very small screens */}
        <span className="topbar-live pill" style={{ background: 'var(--pos-tint)', color: 'var(--pos)' }}>
          <span style={{ width: 6, height: 6, background: 'var(--pos)', borderRadius: '50%', display: 'inline-block' }} />
          live
        </span>
        <button className="btn btn-ghost" style={{ width: 38, padding: 0, justifyContent: 'center' }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0"/>
          </svg>
        </button>
      </div>
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
