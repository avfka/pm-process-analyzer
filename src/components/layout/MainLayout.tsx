import React from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'wouter';

const NAV_LABELS: Record<string, string> = {
  '/':               '01 Главная',
  '/upload':         '02 Данные',
  '/analysis':       '03 AS-IS анализ',
  '/rating':         '04 Ai рейтинг',
  '/recommendations':'05 Рекомендации',
  '/to-be':          '06 TO-BE модель',
  '/research':       '07 Документация',
};

const EVENTS_COUNT = 1842;

function TopBar() {
  const [location] = useLocation();
  const label = NAV_LABELS[location] || '';

  return (
    <header className="topbar">
      <div className="search-bar" style={{ minWidth: 320, maxWidth: 380 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>
        </svg>
        <input placeholder="Найти процесс, кейс или активность…" />
        <span className="pill pill-ghost" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg)' }}>⌘ K</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="pill" style={{ background: 'var(--pos-tint)', color: 'var(--pos)' }}>
          <span style={{ width: 6, height: 6, background: 'var(--pos)', borderRadius: '50%', display: 'inline-block' }} />
          {EVENTS_COUNT} событий · live
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
  return (
    <div className="app">
      <Sidebar />
      <div className="main-col">
        <TopBar />
        <div className="main">
          {children}
        </div>
      </div>
    </div>
  );
}
