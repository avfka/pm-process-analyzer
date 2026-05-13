import React from 'react';
import { Link, useLocation } from 'wouter';

const NAV = [
  { id: 'dashboard', label: 'Главная',        href: '/' },
  { id: 'data',      label: 'Данные',         href: '/upload' },
  { id: 'analysis',  label: 'AS-IS анализ',   href: '/analysis' },
  { id: 'rating',    label: 'Ai рейтинг',     href: '/rating' },
  { id: 'recs',      label: 'Рекомендации',   href: '/recommendations' },
  { id: 'tobe',      label: 'TO-BE модель',   href: '/to-be' },
  { id: 'research',  label: 'Документация',   href: '/research' },
];

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  data:      <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></>,
  analysis:  <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>,
  rating:    <><path d="M12 3l2.6 6 6.4.6-4.9 4.4 1.5 6.5L12 17l-5.6 3.5 1.5-6.5L3 9.6 9.4 9z"/></>,
  recs:      <><path d="M9 18h6M10 22h4M12 2a6 6 0 016 6c0 3-2 4-3 6H9c-1-2-3-3-3-6a6 6 0 016-6z"/></>,
  tobe:      <><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H14a4 4 0 014 4v0a4 4 0 01-4 4h-4a4 4 0 00-4 4v0"/></>,
  research:  <><path d="M4 4h11a4 4 0 014 4v12H8a4 4 0 01-4-4z"/><path d="M4 4v12a4 4 0 014-4h11"/></>,
};

function NavIcon({ id, active }: { id: string; active: boolean }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : 'var(--ink-muted)'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {ICONS[id]}
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className={'sidebar' + (isOpen ? ' open' : '')}>
      {/* brand */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(34, 158, 217, 0.25)',
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4 14h6l-1 8 9-12h-6z"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>PM Analyzer</span>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>operations</span>
        </div>
        {/* Close button — mobile only, hidden on desktop via CSS */}
        <button
          onClick={onClose}
          className="hamburger-btn btn btn-ghost"
          style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', flexShrink: 0 }}
          aria-label="Закрыть меню"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5l14 14M19 5L5 19"/>
          </svg>
        </button>
      </div>

      {/* nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = location === item.href;
            return (
              <Link key={item.id} href={item.href}>
                <a
                  className={'nav-item ' + (active ? 'active' : '')}
                  onClick={onClose}
                >
                  <NavIcon id={item.id} active={active} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* footer */}
      <div style={{ padding: 16, borderTop: '1px solid var(--line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #229ED9 0%, #7c3aed 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>AV</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>А. Фёдорова</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
