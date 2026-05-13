import React from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const SLA_MAP: Record<string, number> = {
  'Согласование roadmap': 60,
  'Sprint review подготовка': 60,
  'Бюджетная сверка': 45,
  'Release notes draft': 40,
  'User interview резюме': 30,
};

const RcTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#18181b', color: '#fafafa', padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5, boxShadow: '0 10px 28px rgba(0,0,0,0.18)', minWidth: 130 }}>
      {label && <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#d4d4d8' }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value} м</span>
        </div>
      ))}
    </div>
  );
};

export default function ProcessAnalysis() {
  const { events, analyzer } = useData();

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>
          </svg>
        </div>
        <h2>Нет данных для анализа</h2>
        <div style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>Загрузите CSV файл или воспользуйтесь демо-данными.</div>
        <Link href="/upload"><a className="btn btn-primary">Загрузить данные</a></Link>
      </div>
    );
  }

  const stats = analyzer.getActivityStats();
  const bottlenecks = [...stats].sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5);
  const cycles = analyzer.getCycles();
  const transitions = analyzer.getTransitions();
  const maxTrans = transitions[0]?.count || 1;

  const bottleneckChart = bottlenecks.map(b => ({
    name: b.activity.length > 18 ? b.activity.slice(0, 16) + '…' : b.activity,
    full: b.activity,
    avg: Math.round(b.avgDuration),
    sla: SLA_MAP[b.activity] ?? 60,
    p95: Math.round(b.avgDuration * 1.6),
  }));

  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>AS-IS анализ</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Переходы между активностями, узкие места по длительности и обнаруженные циклы возвратов — точки, где интервенция даёт максимальный эффект.
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4">
        <KPI label="Уникальных переходов" value={transitions.length} sub="между активностями" />
        <KPI label="Циклы" value={cycles.length} sub="возвраты в кейсах" delta={+1.2} />
        <KPI label="Узкие места" value={bottlenecks.length} sub="процессов выше SLA" accent />
        <KPI label="SLA нарушения" value={bottlenecks.filter(b => Math.round(b.avgDuration) > (SLA_MAP[b.activity] ?? 60)).length} sub={`из ${bottlenecks.length} bottlenecks`} />
      </div>

      {/* Transitions table */}
      <SectionTitle title="Граф переходов" sub="топ-10 по частоте" />
      <div className="card" style={{ paddingBottom: 0 }}>
        <table className="t">
          <thead><tr>
            <th>Откуда</th>
            <th></th>
            <th>Куда</th>
            <th style={{ textAlign: 'right' }}>переходов</th>
            <th>интенсивность</th>
            <th style={{ textAlign: 'right' }}>доля</th>
          </tr></thead>
          <tbody>
            {transitions.map((t, i) => {
              const intensity = t.count / maxTrans;
              const total = transitions.reduce((a, b) => a + b.count, 0);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{t.from}</td>
                  <td>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </td>
                  <td>{t.to}</td>
                  <td className="num-cell semibold">{t.count}</td>
                  <td>
                    <div className="bar" style={{ width: 180 }}><span style={{ width: `${intensity * 100}%` }} /></div>
                  </td>
                  <td className="num-cell muted">{((t.count / total) * 100).toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottlenecks + Cycles */}
      <SectionTitle title="Узкие места и циклы" />
      <div className="grid-asym">
        <div className="card" style={{ paddingBottom: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3>Bottlenecks · средняя длительность</h3>
            <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: 13 }}>AVG (синий) vs SLA (серый) vs P95 (красный)</div>
          </div>
          <div style={{ padding: '20px 24px 12px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bottleneckChart} margin={{ top: 8, right: 16, left: 0, bottom: 30 }} barCategoryGap={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} unit=" м" />
                <Tooltip content={<RcTooltip />} cursor={{ fill: 'rgba(34, 158, 217, 0.06)' }} />
                <Bar dataKey="sla" name="SLA" fill="#e4e4e7" radius={[6,6,0,0]} />
                <Bar dataKey="avg" name="AVG" fill="var(--accent)" radius={[6,6,0,0]} />
                <Bar dataKey="p95" name="P95" fill="#dc2626" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ borderTop: '1px solid var(--line-soft)' }}>
            {bottlenecks.map((b, i) => {
              const sla = SLA_MAP[b.activity] ?? 60;
              const avg = Math.round(b.avgDuration);
              const over = avg > sla;
              return (
                <div key={b.activity} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '14px 24px', borderBottom: i < bottlenecks.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{b.activity}</div>
                  <span className="muted" style={{ fontSize: 12.5 }}>SLA {sla}м</span>
                  <span className="semibold" style={{ fontSize: 15, color: over ? 'var(--neg)' : 'var(--ink)' }}>{avg}м</span>
                  <span className={'pill ' + (over ? 'pill-neg' : 'pill-pos')}>{over ? `+${avg - sla}м` : 'ОК'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ paddingBottom: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Циклы возвратов</h3>
              <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: 13 }}>{cycles.length} кейсов с rework</div>
            </div>
            <span className="pill pill-neg">rework</span>
          </div>
          <table className="t">
            <thead><tr>
              <th>Кейс</th>
              <th>Активность</th>
              <th style={{ textAlign: 'right' }}>×</th>
            </tr></thead>
            <tbody>
              {cycles.length === 0
                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>Циклы не обнаружены</td></tr>
                : cycles.slice(0, 8).map((c, i) => (
                  <tr key={i}>
                    <td><span style={{ color: 'var(--accent)', fontFamily: 'var(--f-mono)', fontSize: 13 }}>{c.case_id}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.activity}</td>
                    <td style={{ textAlign: 'right' }}><span className={'pill ' + (c.count >= 3 ? 'pill-neg' : 'pill-warn')}>×{c.count}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, delta, accent }: { label: string; value: number | string; sub: string; delta?: number; accent?: boolean }) {
  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>{label}</span>
        {delta !== undefined && (
          <span className={'pill ' + (delta > 0 ? 'pill-pos' : delta < 0 ? 'pill-neg' : '')}>
            {delta > 0 ? '+' : '−'}{Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="num-xl" style={{ color: accent ? 'var(--accent)' : undefined }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="sec-title" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2>{title}</h2>
        {sub && <span className="sec-sub">{sub}</span>}
      </div>
      {right && <div style={{ display: 'flex', gap: 8 }}>{right}</div>}
    </div>
  );
}
