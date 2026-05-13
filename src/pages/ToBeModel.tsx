import React from 'react';
import { Link } from 'wouter';
import { useData } from '@/context/DataContext';
import { getToBeModels } from '@/lib/pm-insights';

export default function ToBeModel() {
  const { events, analyzer } = useData();

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H14a4 4 0 014 4v0a4 4 0 01-4 4h-4a4 4 0 00-4 4v0"/>
          </svg>
        </div>
        <h2>Нет данных для TO-BE модели</h2>
        <div style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>Сначала загрузите процессы, чтобы построить целевую модель автоматизации.</div>
        <Link href="/upload"><a className="btn btn-primary">Загрузить данные</a></Link>
      </div>
    );
  }

  const models = getToBeModels(analyzer);

  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>TO-BE модель</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Целевое состояние процессов. Для каждого приоритетного процесса описано, что меняется после автоматизации, какие входы/выходы и какой эффект.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pill">процессов · {models.length}</span>
          <span className="pill pill-pos">p95 · −38%</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {models.map((m, i) => (
          <div key={`${m.process}-${i}`} className="card" style={{ paddingBottom: 0 }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3>{m.process}</h3>
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-muted)' }}>{m.pmbok}</div>
              </div>
              <span className="pill pill-pos">TO-BE</span>
            </div>

            {/* AS-IS → TO-BE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0 }}>
              <div style={{ padding: 24, background: '#fef2f2' }}>
                <div className="eyebrow" style={{ color: 'var(--neg)' }}>AS-IS · ПРОБЛЕМА</div>
                <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>{m.currentIssue}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', background: 'linear-gradient(90deg, #fef2f2 0%, #f0fdf4 100%)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-2)' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </div>
              </div>
              <div style={{ padding: 24, background: '#f0fdf4' }}>
                <div className="eyebrow" style={{ color: 'var(--pos)' }}>TO-BE · СОСТОЯНИЕ</div>
                <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>{m.targetState}</div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              <div>
                <div className="label-overline" style={{ marginBottom: 10 }}>Входы</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.inputs.map(x => (
                    <li key={x} style={{ display: 'flex', gap: 8, fontSize: 13, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--ink-faint)', flexShrink: 0 }}>→</span>{x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="label-overline" style={{ marginBottom: 10 }}>Выходы</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.outputs.map(x => (
                    <li key={x} style={{ display: 'flex', gap: 8, fontSize: 13, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--pos)', flexShrink: 0 }}>←</span>{x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="label-overline" style={{ marginBottom: 10 }}>Автоматизация</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}>{m.automation}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--accent-soft)', borderRadius: 12, margin: '-4px 0' }}>
                <div className="eyebrow">Ожидаемый эффект</div>
                <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', fontWeight: 500 }}>{m.expectedEffect}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
