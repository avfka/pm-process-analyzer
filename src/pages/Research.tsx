import React from 'react';

const SOURCES = [
  ['McKinsey & Company, 2024',          '40 PM, 4 страны',                '−40% контентно-тяжёлые задачи'],
  ['Asana Anatomy of Work, 2023',       '9 615 респондентов',              '58% времени — work about work'],
  ['McKinsey Global Institute, 2023',   '63 бизнес-кейса, 16 отраслей',    '$4.4 трлн потенциал GenAI'],
  ['Gartner · State of PM 2024',        'Опрос 412 PM',                    '63% хотят AI-ассистента'],
  ['PMI Pulse of the Profession 2023',  'n = 3 492',                       'Communications — 88% времени PM'],
];

const PMBOK_MAPPING = [
  ['Подготовка отчётов',        'Communications Management',     '10.2 Manage Communications',           'p. 379'],
  ['Согласования',              'Stakeholder Management',        '13.3 Manage Stakeholder Engagement',   'p. 523'],
  ['Backlog и требования',      'Scope Management',              '5.2 Collect Requirements',             'p. 138'],
  ['Ручная коммуникация',       'Communications Management',     '10.1 Plan Communications',             'p. 366'],
  ['Сбор данных и мониторинг',  'Integration Management',        '4.5 Monitor and Control Project Work', 'p. 105'],
];

const FORMULA_PARTS = [
  ['F', 'Частота',       '0.35', 'чем чаще процесс, тем выше эффект автоматизации'],
  ['D', 'Длительность',  '0.25', 'чем дольше ручное выполнение, тем выше ROI'],
  ['V', 'Вариативность', '0.20', 'ниже вариативность — проще автоматизировать'],
  ['S', 'Структура',     '0.20', 'системные данные автоматизируются лучше встреч'],
];

export default function Research() {
  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Документация</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Источники, методология показателя Ai и нормативная база — на каких исследованиях стоит работа и как процессы PM-команды отображаются в PMBoK 6.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pill">источников · {SOURCES.length}</span>
          <span className="pill pill-accent">PMBoK 6</span>
        </div>
      </div>

      {/* Sources */}
      <div className="sec-title">
        <h2>Источники</h2>
        <span className="sec-sub">исследования и бенчмарки</span>
      </div>
      <div className="card table-wrap" style={{ paddingBottom: 0 }}>
        <table className="t">
          <thead><tr>
            <th>Источник</th>
            <th>Выборка</th>
            <th>Ключевой вывод</th>
          </tr></thead>
          <tbody>
            {SOURCES.map(([s, n, f]) => (
              <tr key={s}>
                <td style={{ fontWeight: 600 }}>{s}</td>
                <td className="muted">{n}</td>
                <td>{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card card-pad" style={{ marginTop: 16, background: 'var(--accent-soft)', color: 'var(--accent-2)', fontSize: 13.5, lineHeight: 1.55, fontWeight: 600 }}>
        McKinsey 2024 (−40% времени на контент-задачи) · средняя ЗП PM hh.ru — 200 000 ₽/мес · 168 ч/мес
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="eyebrow">Расшифровка графика Bottlenecks</div>
        <h3 style={{ marginTop: 6 }}>Bottlenecks · средняя длительность</h3>
        <div style={{ marginTop: 12, display: 'grid', gap: 10, fontSize: 13.5, lineHeight: 1.55 }}>
          <div><strong style={{ color: 'var(--accent)' }}>AVG</strong> — средняя длительность выполнения активности по всем кейсам.</div>
          <div><strong style={{ color: 'var(--ink-muted)' }}>SLA</strong> — целевой норматив времени: сколько процесс должен занимать в оптимальном состоянии.</div>
          <div><strong style={{ color: 'var(--neg)' }}>P95</strong> — 95-й перцентиль: длительность, ниже которой укладываются 95% наблюдений; показывает хвост долгих кейсов.</div>
        </div>
      </div>

      {/* Methodology */}
      <div className="sec-title">
        <h2>Методология Ai</h2>
        <span className="sec-sub">взвешенный композитный индекс</span>
      </div>
      <div className="card card-pad">
        <div className="methodology-formula" style={{ padding: '28px 24px', background: 'var(--accent-soft)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em' }}>
          <span style={{ color: 'var(--accent)' }}>Aᵢ</span>
          <span style={{ color: 'var(--ink-muted)' }}>=</span>
          <span><span style={{ color: 'var(--accent)' }}>0.35</span> · F</span>
          <span style={{ color: 'var(--ink-faint)' }}>+</span>
          <span><span style={{ color: 'var(--accent)' }}>0.25</span> · D</span>
          <span style={{ color: 'var(--ink-faint)' }}>+</span>
          <span><span style={{ color: 'var(--accent)' }}>0.20</span> · V</span>
          <span style={{ color: 'var(--ink-faint)' }}>+</span>
          <span><span style={{ color: 'var(--accent)' }}>0.20</span> · S</span>
        </div>

        <div className="grid-4" style={{ marginTop: 16, gap: 12 }}>
          {FORMULA_PARTS.map(([l, n, w, d]) => (
            <div key={l} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{l}</span>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>вес {w}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>{n}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 18, background: 'var(--bg)', borderRadius: 12, borderLeft: '3px solid var(--accent)' }}>
          <div className="eyebrow">Пример расчёта</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
            Если F = 80, D = 60, V = 70, S = 90, то{' '}
            <span className="inline-formula" style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
              Aᵢ = 0.35×80 + 0.25×60 + 0.20×70 + 0.20×90 = 75
            </span>.
            Такой процесс попадает в высокий приоритет автоматизации (Aᵢ ≥ 75).
          </div>
        </div>
      </div>

      {/* PMBoK mapping */}
      <div className="sec-title">
        <h2>Маппинг на PMBoK 6</h2>
        <span className="sec-sub">связь с нормативной базой</span>
      </div>
      <div className="card table-wrap" style={{ paddingBottom: 0 }}>
        <table className="t">
          <thead><tr>
            <th>Процесс PM</th>
            <th>Область знаний</th>
            <th>Процесс PMBoK 6</th>
            <th style={{ textAlign: 'right' }}>Стр.</th>
          </tr></thead>
          <tbody>
            {PMBOK_MAPPING.map(([p, a, b, pg]) => (
              <tr key={p}>
                <td style={{ fontWeight: 600 }}>{p}</td>
                <td className="muted">{a}</td>
                <td><span style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', padding: '3px 10px', borderRadius: 999, fontWeight: 600, fontSize: 12.5 }}>{b}</span></td>
                <td className="num-cell muted">{pg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 40, padding: '24px 0', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, color: 'var(--ink-muted)' }}>
        <div>PM Process Analyzer · diploma edition · v 0.4.2</div>
        <div>2026</div>
      </div>
    </div>
  );
}
