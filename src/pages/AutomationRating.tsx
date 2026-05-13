import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRub, getAutomationDetail } from '@/lib/pm-insights';

const RcTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#18181b', color: '#fafafa', padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5, boxShadow: '0 10px 28px rgba(0,0,0,0.18)', minWidth: 130 }}>
      {label && <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#d4d4d8' }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AutomationRating() {
  const { events, analyzer } = useData();
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 6 6.4.6-4.9 4.4 1.5 6.5L12 17l-5.6 3.5 1.5-6.5L3 9.6 9.4 9z"/></svg>
        </div>
        <h2>Нет данных</h2>
        <div style={{ color: 'var(--ink-muted)', maxWidth: 360 }}>Загрузите данные, чтобы рассчитать показатель автоматизируемости.</div>
        <Link href="/upload"><a className="btn btn-primary">Загрузить данные</a></Link>
      </div>
    );
  }

  const scores = analyzer.getAutomationScores();
  const selected = scores[selectedIdx] ?? scores[0];
  const selectedDetail = selected ? getAutomationDetail(selected, events) : null;

  const chartData = scores.slice(0, 10).map(s => ({
    name: s.activity.length > 14 ? s.activity.slice(0, 12) + '…' : s.activity,
    full: s.activity,
    F: Math.round(s.freqScore * 0.35),
    D: Math.round(s.durScore * 0.25),
    V: Math.round(s.varScore * 0.20),
    S: Math.round(s.structScore * 0.20),
    total: s.score,
  }));

  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Ai рейтинг</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Композитный показатель автоматизируемости. Чем выше Ai — тем приоритетнее автоматизация.
          </div>
        </div>
      </div>

      {/* Stacked chart */}
      <div className="sec-title">
        <h2>Структура показателя</h2>
        <span className="sec-sub">вклад каждого фактора · топ-10</span>
      </div>
      <div className="card" style={{ paddingBottom: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)' }}>
          <h3>Stacked Ai · 0–100</h3>
        </div>
        <div style={{ padding: 24 }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }} barCategoryGap={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<RcTooltip />} cursor={{ fill: 'rgba(34, 158, 217, 0.06)' }} />
              <Bar dataKey="F" name="F · Частота"        stackId="a" fill="#229ED9" />
              <Bar dataKey="D" name="D · Длительность"   stackId="a" fill="#7AC9E9" />
              <Bar dataKey="V" name="V · Вариативность"  stackId="a" fill="#CFE9F8" />
              <Bar dataKey="S" name="S · Структура"       stackId="a" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            {[['F · Частота','#229ED9'],['D · Длительность','#7AC9E9'],['V · Вариативность','#CFE9F8'],['S · Структура','#7c3aed']].map(([n,c]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, background: c, borderRadius: 4 }} />
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail table + card */}
      <div className="sec-title">
        <h2>Детальный рейтинг</h2>
        <span className="sec-sub">кликните строку — откроется детальная карточка</span>
      </div>
      <div className="grid-sidebar-r">
        <div className="card" style={{ paddingBottom: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3>Все процессы</h3>
            <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: 13 }}>{scores.length} процессов · сортировка по Ai ↓</div>
          </div>
          <table className="t">
            <thead><tr>
              <th>Процесс</th>
              <th style={{ textAlign: 'right' }}>freq</th>
              <th style={{ textAlign: 'right' }}>dur</th>
              <th style={{ width: 140 }}>Ai</th>
              <th>приоритет</th>
            </tr></thead>
            <tbody>
              {scores.map((s, i) => {
                const active = i === selectedIdx;
                return (
                  <tr key={s.activity} className={active ? 'active' : ''} onClick={() => setSelectedIdx(i)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.activity}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>F·{s.freqScore} D·{s.durScore} V·{s.varScore} S·{s.structScore}</div>
                    </td>
                    <td className="num-cell">{s.frequency}</td>
                    <td className="num-cell muted">{Math.round(s.avgDuration)}м</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="bar" style={{ width: 80 }}>
                          <span style={{ width: `${s.score}%`, background: s.priority === 'Высокий' ? 'var(--accent)' : s.priority === 'Средний' ? '#f59e0b' : 'var(--ink-faint)' }} />
                        </div>
                        <span className="semibold" style={{ fontSize: 14, width: 24, textAlign: 'right' }}>{s.score}</span>
                      </div>
                    </td>
                    <td><span className={'pill ' + (s.priority === 'Высокий' ? 'pill-accent' : s.priority === 'Средний' ? 'pill-warn' : '')}>{s.priority}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected && selectedDetail && (
          <div className="card card-pad" style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
            <span className={'pill ' + (selected.priority === 'Высокий' ? 'pill-accent' : selected.priority === 'Средний' ? 'pill-warn' : '')}>{selected.priority} приоритет</span>
            <h3 style={{ marginTop: 10, fontSize: 20 }}>{selected.activity}</h3>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="num-xl" style={{ color: 'var(--accent)', fontSize: 56 }}>{selected.score}</span>
              <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Ai · 0–100</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="label-overline" style={{ marginBottom: 10 }}>Компоненты</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([
                  ['F', 'Частота',        selected.freqScore,   0.35, '#229ED9'],
                  ['D', 'Длительность',   selected.durScore,    0.25, '#7AC9E9'],
                  ['V', 'Вариативность',  selected.varScore,    0.20, '#CFE9F8'],
                  ['S', 'Структура',       selected.structScore, 0.20, '#7c3aed'],
                ] as [string, string, number, number, string][]).map(([k, n, v, w, c]) => (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}><span className="bold" style={{ color: c }}>{k}</span> · {n}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{v} × {w}</span>
                    </div>
                    <div className="bar"><span style={{ width: `${v}%`, background: c }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 14, background: 'var(--accent-soft)', borderRadius: 12 }}>
              <div className="eyebrow">TO-BE</div>
              <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: 'var(--ink-3)' }}>{selectedDetail.toBe}</div>
            </div>

            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--pos-tint)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pos)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Экономия</div>
              <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--ink-muted)' }}>AS-IS</span><br /><strong>{selectedDetail.asIsWeekly} мин/нед</strong></div>
                <div><span style={{ color: 'var(--ink-muted)' }}>TO-BE</span><br /><strong>{selectedDetail.toBeWeekly} мин/нед</strong></div>
                <div><span style={{ color: 'var(--ink-muted)' }}>Снижение</span><br /><strong>−{selectedDetail.savingPercent}%</strong></div>
                <div><span style={{ color: 'var(--ink-muted)' }}>В деньгах</span><br /><strong>~{formatRub(selectedDetail.monthlyRub)}/мес</strong></div>
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--ink-muted)', padding: '10px 14px', background: 'var(--bg)', borderRadius: 10 }}>
              <strong style={{ color: 'var(--violet)' }}>PMBoK</strong><br />{selectedDetail.pmbok}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Link href="/to-be"><a className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>В TO-BE →</a></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
