import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import type { Recommendation } from '@/lib/analyzer';
import {
  formatRub,
  MCKINSEY_AI_TIME_REDUCTION,
  PM_MONTHLY_SALARY,
  RECOMMENDATION_EVIDENCE_BY_ID,
  WEEKS_PER_MONTH,
  WORK_HOURS_PER_MONTH,
} from '@/lib/pm-insights';

const TYPE_CONFIG: Record<Recommendation['type'], { color: string; tint: string; label: string }> = {
  report:   { color: '#229ED9', tint: '#e3f2fa', label: 'отчёт' },
  data:     { color: '#7c3aed', tint: '#ede9fe', label: 'данные' },
  approval: { color: '#dc2626', tint: '#fee2e2', label: 'согласование' },
  backlog:  { color: '#f59e0b', tint: '#fef3c7', label: 'бэклог' },
  manual:   { color: '#16a34a', tint: '#dcfce7', label: 'ручное' },
};

function TypeIcon({ type }: { type: Recommendation['type'] }) {
  const paths: Record<Recommendation['type'], React.ReactNode> = {
    report:   <><path d="M5 3h10l4 4v14H5z"/><path d="M14 3v4h4M9 16v-3M12 16v-6M15 16v-4"/></>,
    data:     <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></>,
    approval: <><path d="M4 12l5 5L20 6"/></>,
    backlog:  <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    manual:   <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></>,
  };
  const t = TYPE_CONFIG[type];
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {paths[type]}
    </svg>
  );
}

function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  const [open, setOpen] = useState(false);
  const t = TYPE_CONFIG[rec.type];
  const evidence = RECOMMENDATION_EVIDENCE_BY_ID[rec.id];

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 16, padding: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: t.tint, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TypeIcon type={rec.type} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>{String(index + 1).padStart(2, '0')}</span>
            <span className="pill" style={{ background: t.tint, color: t.color }}>{t.label}</span>
            <span className={'pill ' + (rec.priority === 'Высокий' ? 'pill-accent' : rec.priority === 'Средний' ? 'pill-warn' : '')}>{rec.priority}</span>
            <span className="pill">усилия · {rec.effortLevel}</span>
            <span className="pill pill-ghost">{rec.metric}</span>
          </div>
          <h3 style={{ fontSize: 18 }}>{rec.title}</h3>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>{rec.explanation}</p>

          <div style={{ marginTop: 14, padding: '12px 16px', background: t.tint, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>
            <div>
              <div style={{ fontSize: 11, color: t.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Эффект</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2, fontWeight: 500 }}>{rec.effect}</div>
            </div>
          </div>

          {open && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="label-overline" style={{ marginBottom: 6 }}>Связанные активности</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rec.relatedActivities.map(a => <span key={a} className="pill">{a}</span>)}
                </div>
                <div className="label-overline" style={{ marginTop: 14, marginBottom: 6 }}>Инструмент</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{rec.tool}</div>
              </div>
              <div>
                <div className="label-overline" style={{ marginBottom: 6 }}>Источник данных</div>
                <div style={{ fontSize: 13.5 }}>{evidence?.source ?? 'Источник будет уточнён после классификации процесса'}</div>
                <div className="label-overline" style={{ marginTop: 14, marginBottom: 6 }}>PMBoK 6</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{evidence?.pmbok ?? 'PMBoK 6 · процесс будет уточнён после классификации'}</div>
              </div>
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(s => !s)} style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {open ? <path d="M6 15l6-6 6 6"/> : <path d="M6 9l6 6 6-6"/>}
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const { events, analyzer } = useData();
  const [team, setTeam] = useState(3);

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warn-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a6 6 0 016 6c0 3-2 4-3 6H9c-1-2-3-3-3-6a6 6 0 016-6z"/></svg>
        </div>
        <h2>Нет данных для анализа</h2>
        <div style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>Загрузите CSV или воспользуйтесь демо-данными, чтобы получить персонализированные рекомендации.</div>
        <Link href="/upload"><a className="btn btn-primary">Загрузить данные</a></Link>
      </div>
    );
  }

  const recs = analyzer.generateRecommendations();
  const counts = {
    high: recs.filter(r => r.priority === 'Высокий').length,
    mid:  recs.filter(r => r.priority === 'Средний').length,
    low:  recs.filter(r => r.priority === 'Низкий').length,
  };

  const totalMinutes = events.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const minuteRate = PM_MONTHLY_SALARY / (WORK_HOURS_PER_MONTH * 60);
  const monthly = totalMinutes * MCKINSEY_AI_TIME_REDUCTION * minuteRate * team;
  const yearly  = monthly * 12;
  const weeklyH = (totalMinutes * MCKINSEY_AI_TIME_REDUCTION / (WEEKS_PER_MONTH * 60) * team).toFixed(1);

  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Рекомендации</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Сгенерированы автоматически из event log. По каждому процессу — приоритет, ожидаемый эффект, инструмент и нормативное обоснование.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pill pill-accent">высокий · {counts.high}</span>
          <span className="pill pill-warn">средний · {counts.mid}</span>
          <span className="pill">низкий · {counts.low}</span>
        </div>
      </div>

      {/* Calculator */}
      <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, #ffffff 60%)' }}>
        <div className="eyebrow">Калькулятор эффекта</div>
        <h3 style={{ marginTop: 4 }}>Влияние на команду PM</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 32, marginTop: 24, alignItems: 'center' }}>
          <div>
            <div className="label-overline">Размер команды PM</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span className="num-xl" style={{ color: 'var(--accent)' }}>{team}</span>
              <span className="muted">PM</span>
            </div>
            <input type="range" min={1} max={20} value={team} onChange={e => setTeam(+e.target.value)} style={{ width: '100%', marginTop: 12, accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
              <span>1</span><span>10</span><span>20</span>
            </div>
          </div>
          <div>
            <div className="label-overline">В месяц</div>
            <div className="num-md" style={{ marginTop: 8, color: 'var(--accent)' }}>~{new Intl.NumberFormat('ru-RU').format(Math.round(monthly / 1000))}k ₽</div>
          </div>
          <div>
            <div className="label-overline">В год</div>
            <div className="num-md" style={{ marginTop: 8 }}>~{new Intl.NumberFormat('ru-RU').format(Math.round(yearly / 1_000_000))} млн ₽</div>
          </div>
          <div>
            <div className="label-overline">Часов в неделю</div>
            <div className="num-md" style={{ marginTop: 8 }}>~{weeklyH} ч</div>
          </div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)', fontSize: 12.5, color: 'var(--ink-muted)' }}>
          McKinsey 2024 (−40% времени на контент-задачи) · средняя ЗП PM hh.ru — 200 000 ₽/мес · 168 ч/мес
        </div>
      </div>

      {/* Recommendations list */}
      <div className="sec-title">
        <h2>Рекомендации</h2>
        <span className="sec-sub">{recs.length} элементов · по убыванию Ai</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recs.map((r, i) => <RecCard key={r.id} rec={r} index={i} />)}
      </div>
    </div>
  );
}
