import { useData } from "@/context/DataContext";
import { Link } from "wouter";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getDashboardMetrics, getWorkloadSlices, formatRub } from "@/lib/pm-insights";

const CHART_MULTI = ['#229ED9', '#7c3aed', '#16a34a', '#f59e0b', '#dc2626', '#06b6d4', '#ec4899', '#64748b'];

const RESEARCH_PAINS = [
  { value: '58%',       title: 'рабочего дня уходит на «work about work»',                   src: 'Asana · Anatomy of Work 2023',  sample: 'n = 9 615' },
  { value: '116 мин',   title: 'на контентно-тяжёлые задачи без AI',                         src: 'McKinsey · 2024',               sample: 'n = 40 PM' },
  { value: '−40%',      title: 'времени при автоматизации контентно-тяжёлых задач',           src: 'McKinsey · GenAI in PM, 2024',  sample: 'n = 40 PM' },
  { value: '$4.4 трлн', title: 'потенциал генеративного AI в B2B-функциях',                  src: 'MGI · 2023',                    sample: '63 кейса'  },
];

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

function fmtNum(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n);
}

function EmptyState() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Главная</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Загрузите event log PM-команды для анализа операционной нагрузки, рейтинга автоматизации Ai и построения TO-BE модели.
          </div>
        </div>
      </div>

      <div className="grid-4">
        {RESEARCH_PAINS.map((p, i) => (
          <div key={i} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
            <div className="num-lg" style={{ color: i === 2 ? 'var(--accent)' : 'var(--ink)' }}>{p.value}</div>
            <div style={{ marginTop: 16, fontSize: 14.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{p.title}</div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--ink-muted)' }}>
              <span>{p.src}</span>
              <span>{p.sample}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--accent-tint) 100%)' }}>
        <div>
          <div className="eyebrow">Начните работу</div>
          <h3 style={{ marginTop: 4 }}>Загрузите event log PM-команды</h3>
          <div style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>CSV с полями case_id, activity, timestamp, actor, system, duration.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/upload"><a className="btn">Загрузить CSV</a></Link>
          <Link href="/upload"><a className="btn btn-primary">Демо данные</a></Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { events, analyzer } = useData();
  if (events.length === 0) return <EmptyState />;

  const slices = getWorkloadSlices(events);
  const m = getDashboardMetrics(events);
  const topScores = analyzer.getAutomationScores().slice(0, 4);

  const workloadChart = slices.map(s => ({ cat: s.category, hours: s.hours, share: s.share }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Главная</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Структура операционной нагрузки PM-команды, рейтинг автоматизации и потенциальный экономический эффект.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/upload"><a className="btn btn-primary">
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/></svg>
            Импорт CSV
          </a></Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4">
        <KPI label="Трудозатраты"       value={`${m.totalHours} ч`}                                        sub={`${fmtNum(events.length)} событий за квартал`}                 delta={+4.2} />
        <KPI label="Потенциал экономии" value={`~${fmtNum(Math.round(m.monthlySavingRub / 1000))}k ₽`}   sub="в месяц · по McKinsey 2024 (−40% контентно-тяжёлых)"          delta={+12.6} accent />
        <KPI label="Рутина · в неделю"  value={`${m.routineHoursPerWeek} ч`}                              sub="часов на 1 PM — work about work"                               delta={-2.4} />
        <KPI label="Work about work"    value="58%"                                                        sub="среднего рабочего дня · Asana 2023" />
      </div>

      {/* Workload chart */}
      <SectionTitle title="Распределение трудозатрат" sub={`${slices.length} категорий · ${m.totalHours} часов`}
        right={<><span className="pill">часы</span><span className="pill pill-ghost">доля %</span></>}
      />
      <div className="card" style={{ paddingBottom: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h3>По категориям задач PM</h3>
            <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: 13 }}>квартал к кварталу — изменение справа</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr' }}>
          <div style={{ padding: 24 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={workloadChart} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 8 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} unit=" ч" />
                <YAxis dataKey="cat" type="category" width={180} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<RcTooltip />} cursor={{ fill: 'rgba(34, 158, 217, 0.08)' }} />
                <Bar dataKey="hours" name="часы" fill="var(--accent)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ borderLeft: '1px solid var(--line-soft)' }}>
            <table className="t">
              <thead><tr>
                <th>Категория</th>
                <th style={{ textAlign: 'right' }}>часы</th>
                <th style={{ textAlign: 'right' }}>доля</th>
              </tr></thead>
              <tbody>
                {slices.map((s) => (
                  <tr key={s.category}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{s.category}</td>
                    <td className="num-cell semibold">{s.hours}</td>
                    <td className="num-cell muted">{s.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top AI / donut */}
      <SectionTitle title="Где автоматизировать первым" sub="топ-4 процесса по показателю Ai" />
      <div className="grid-asym">
        <div className="card" style={{ paddingBottom: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3>Топ процессов · Ai</h3>
            <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: 13 }}>0.35·F + 0.25·D + 0.20·V + 0.20·S</div>
          </div>
          <table className="t">
            <thead><tr>
              <th>Процесс</th>
              <th style={{ textAlign: 'right' }}>частота</th>
              <th style={{ textAlign: 'right' }}>мин</th>
              <th style={{ width: 140 }}>Ai</th>
              <th>приоритет</th>
            </tr></thead>
            <tbody>
              {topScores.map((s) => (
                <tr key={s.activity}>
                  <td style={{ fontWeight: 500 }}>{s.activity}</td>
                  <td className="num-cell">{s.frequency}</td>
                  <td className="num-cell muted">{Math.round(s.avgDuration)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="bar" style={{ width: 80 }}><span style={{ width: `${s.score}%` }} /></div>
                      <span className="semibold" style={{ fontSize: 14, width: 24, textAlign: 'right' }}>{s.score}</span>
                    </div>
                  </td>
                  <td>
                    <span className={'pill ' + (s.priority === 'Высокий' ? 'pill-accent' : s.priority === 'Средний' ? 'pill-warn' : '')}>{s.priority}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 4 }}>Структура часов</h3>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 12 }}>визуальная разбивка по категориям</div>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={slices} dataKey="hours" nameKey="category" innerRadius={68} outerRadius={100} paddingAngle={2} stroke="var(--surface)" strokeWidth={3}>
                  {slices.map((_, i) => <Cell key={i} fill={CHART_MULTI[i % CHART_MULTI.length]} />)}
                </Pie>
                <Tooltip content={<RcTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>всего</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{m.totalHours}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>часов</div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row k="Доля work about work" v={<span style={{ color: 'var(--accent)' }}>58%</span>} />
            <Row k="Автоматизируемо" v="73%" />
            <Row k="Топ категория" v={slices[0]?.category ?? '—'} />
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div className="section-gap card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--accent-tint) 100%)' }}>
        <div>
          <div className="eyebrow">Следующий шаг</div>
          <h3 style={{ marginTop: 4 }}>Откройте детальный Ai-рейтинг по каждому процессу</h3>
          <div style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>Посмотрите F·D·V·S факторы и постройте TO-BE модель для топовых процессов.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/analysis"><a className="btn">AS-IS</a></Link>
          <Link href="/rating"><a className="btn btn-primary">Ai рейтинг →</a></Link>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, delta, accent }: { label: string; value: string; sub: string; delta?: number; accent?: boolean }) {
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5 }}>
      <span style={{ color: 'var(--ink-muted)' }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}
