import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import Papa from 'papaparse';
import { DEMO_DATA, ProcessEvent } from '@/lib/demo-data';

/* ── Auto-detection hints ─────────────────────────────────── */
const FIELD_HINTS: Record<string, string[]> = {
  case_id:   ['case_id', 'caseid', 'id', 'issue key', 'issue_key', 'identifier', 'key', 'номер', 'кейс', 'проект'],
  activity:  ['activity', 'summary', 'title', 'name', 'task', 'subject', 'задача', 'название', 'активность', 'действие'],
  timestamp: ['timestamp', 'created', 'date', 'created_at', 'createdat', 'time', 'started', 'дата', 'время', 'создан'],
  actor:     ['actor', 'assignee', 'owner', 'author', 'assign', 'user', 'исполнитель', 'автор', 'участник', 'ответственный'],
  system:    ['system', 'platform', 'source', 'project', 'tool', 'систем', 'источник', 'платформ'],
  duration:  ['duration', 'story points', 'storypoints', 'estimate', 'spent', 'time spent', 'minutes', 'hours', 'длительность', 'минуты', 'часы', 'оценка'],
};

const FIELD_META: Record<string, { label: string; desc: string; required: boolean }> = {
  case_id:   { label: 'case_id',   desc: 'Идентификатор кейса или процесса',  required: true  },
  activity:  { label: 'activity',  desc: 'Название активности или шага',       required: true  },
  timestamp: { label: 'timestamp', desc: 'Дата и время события',               required: true  },
  actor:     { label: 'actor',     desc: 'Исполнитель или роль',               required: true  },
  system:    { label: 'system',    desc: 'Источник события (можно задать вручную)', required: false },
  duration:  { label: 'duration',  desc: 'Длительность в минутах',             required: true  },
};

const FIELD_ORDER = ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'];

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();
  for (const field of FIELD_ORDER) {
    for (const header of headers) {
      if (used.has(header)) continue;
      const h = header.toLowerCase();
      if (FIELD_HINTS[field].some(hint => h.includes(hint.toLowerCase()))) {
        mapping[field] = header;
        used.add(header);
        break;
      }
    }
  }
  return mapping;
}

/* ── Types ────────────────────────────────────────────────── */
type Stage = 'idle' | 'mapping' | 'loaded';

interface PendingFile {
  file: File;
  headers: string[];
  rawRows: any[];
  mapping: Record<string, string>;
  systemFallback: string;
}

interface ImportBatch {
  id: string;
  fileName: string;
  count: number;
}

/* ── Component ────────────────────────────────────────────── */
export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();

  const [stage, setStage] = useState<Stage>(events.length > 0 ? 'loaded' : 'idle');
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = analyzer.basicStats;
  const systemsCount = new Set(events.map(e => e.system)).size;

  /* ── Handlers ─────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 200,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          setError('Не удалось прочитать заголовки CSV. Проверьте формат файла.');
          return;
        }
        const detected = autoDetect(headers);
        setPending({ file, headers, rawRows: results.data as any[], mapping: detected, systemFallback: '' });
        setStage('mapping');
      },
      error: (err) => setError(`Ошибка чтения файла: ${err.message}`),
    });
  };

  const handleMappingChange = (field: string, col: string) => {
    if (!pending) return;
    setPending(p => p ? { ...p, mapping: { ...p.mapping, [field]: col } } : p);
  };

  const handleSystemFallback = (val: string) => {
    if (!pending) return;
    setPending(p => p ? { ...p, systemFallback: val } : p);
  };

  const handleApplyMapping = () => {
    if (!pending) return;
    const { file, rawRows, mapping, systemFallback } = pending;

    const missing = FIELD_ORDER.filter(f => FIELD_META[f].required && !mapping[f]);
    if (missing.length > 0) {
      setError(`Сопоставьте обязательные поля: ${missing.join(', ')}`);
      return;
    }

    const durations = rawRows
      .map(r => Number(r[mapping.duration]))
      .filter(d => isFinite(d) && d > 0);
    const avgDur = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 30;

    const parsed: ProcessEvent[] = rawRows.map(r => ({
      case_id:   String(r[mapping.case_id]  ?? ''),
      activity:  String(r[mapping.activity]  ?? ''),
      timestamp: String(r[mapping.timestamp] ?? ''),
      actor:     String(r[mapping.actor]     ?? ''),
      system:    mapping.system ? (String(r[mapping.system] ?? '') || systemFallback || 'Unknown') : (systemFallback || 'Unknown'),
      duration:  Number(r[mapping.duration]) || avgDur,
    })).filter(e => e.case_id && e.activity);

    if (parsed.length === 0) {
      setError('После маппинга не осталось валидных строк. Проверьте соответствие колонок.');
      return;
    }

    const next = stage === 'loaded' ? [...events, ...parsed] : parsed;
    setEvents(next);
    setBatches(prev => [...prev, { id: `${file.name}-${Date.now()}`, fileName: file.name, count: parsed.length }]);
    setPending(null);
    setIsDemoLoaded(false);
    setStage('loaded');
    setError(null);
  };

  const handleDemoLoad = () => {
    if (isDemoLoaded) return;
    loadDemoData();
    setIsDemoLoaded(true);
    setStage('loaded');
    setBatches([{ id: 'demo', fileName: 'demo-event-log.csv', count: DEMO_DATA.length }]);
    setPending(null);
    setError(null);
  };

  const handleClear = () => {
    clearData();
    setIsDemoLoaded(false);
    setStage('idle');
    setPending(null);
    setBatches([]);
    setError(null);
  };

  const handleExport = () => {
    if (!events.length) return;
    const csv = Papa.unparse(events.map(e => ({
      case_id: e.case_id, activity: e.activity, timestamp: e.timestamp,
      actor: e.actor, system: e.system, duration: e.duration,
    })));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'combined-event-log.csv';
    a.click();
  };

  const handleCancelMapping = () => {
    setPending(null);
    setStage(events.length > 0 ? 'loaded' : 'idle');
    setError(null);
  };

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 0 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1>Данные</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 580, fontSize: 15, lineHeight: 1.55 }}>
            Загрузите CSV из любого источника — Jira, Notion, Sheets, YouTrack. Парсер определит колонки автоматически и предложит сопоставить их с нужными полями.
          </div>
        </div>
        {stage === 'loaded' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={handleClear}>Сбросить</button>
            <button className="btn btn-sm" onClick={handleExport}>Скачать CSV</button>
            <Link href="/analysis"><a className="btn btn-primary btn-sm">К AS-IS →</a></Link>
          </div>
        )}
      </div>

      {/* ── IDLE: big upload + demo ── */}
      {stage === 'idle' && (
        <>
          <div className="grid-asym" style={{ alignItems: 'start' }}>
            <UploadZone onChange={handleFileSelect} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DemoCard onLoad={handleDemoLoad} loaded={isDemoLoaded} />
            </div>
          </div>
          <ExportGuide />
        </>
      )}

      {/* ── MAPPING ── */}
      {stage === 'mapping' && pending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* File info banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--accent-soft)', borderRadius: 14, border: '1px solid var(--accent-tint)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{pending.file.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                Обнаружено {pending.headers.length} колонок · {pending.rawRows.length} строк
                · {Object.values(pending.mapping).filter(Boolean).length} из {FIELD_ORDER.length} полей определены автоматически
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleCancelMapping}>Отмена</button>
          </div>

          {/* Mapper */}
          <div className="card">
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)' }}>
              <h3>Сопоставление колонок</h3>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
                Выберите колонку из вашего файла для каждого поля. Зелёные — определены автоматически.
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {FIELD_ORDER.map(field => {
                const meta = FIELD_META[field];
                const selected = pending.mapping[field] ?? '';
                const isDetected = Boolean(autoDetect(pending.headers)[field]);
                const isSet = Boolean(selected);
                const isMissing = meta.required && !isSet && field !== 'system';

                return (
                  <div key={field} style={{
                    display: 'grid', gridTemplateColumns: '200px 1fr 280px',
                    gap: 16, alignItems: 'center', padding: '14px 24px',
                    borderBottom: '1px solid var(--line-soft)',
                    background: isMissing ? 'var(--neg-tint)' : undefined,
                  }}>
                    {/* Field info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: isSet ? 'var(--accent-soft)' : isMissing ? 'var(--neg-tint)' : 'var(--bg)', color: isSet ? 'var(--accent-2)' : isMissing ? 'var(--neg)' : 'var(--ink-muted)', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12.5, fontFamily: 'var(--f-mono)' }}>
                          {meta.label}
                        </span>
                        {!meta.required && <span className="pill" style={{ fontSize: 11 }}>необязательное</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 5 }}>{meta.desc}</div>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isSet && isDetected && (
                        <span className="pill pill-pos" style={{ fontSize: 11.5 }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                          Определено автоматически
                        </span>
                      )}
                      {isSet && !isDetected && (
                        <span className="pill" style={{ fontSize: 11.5, background: 'var(--warn-tint)', color: 'var(--warn)' }}>Задано вручную</span>
                      )}
                      {!isSet && !isMissing && (
                        <span className="pill" style={{ fontSize: 11.5 }}>Не выбрано</span>
                      )}
                      {isMissing && (
                        <span className="pill pill-neg" style={{ fontSize: 11.5 }}>Обязательное поле</span>
                      )}
                    </div>

                    {/* Dropdown / input */}
                    <div>
                      {field === 'system' && !selected ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            value=""
                            onChange={e => { if (e.target.value) handleMappingChange(field, e.target.value); }}
                            style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--line-strong)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}
                          >
                            <option value="">— из колонки CSV —</option>
                            {pending.headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <input
                            placeholder="или текст (Jira, Slack…)"
                            value={pending.systemFallback}
                            onChange={e => handleSystemFallback(e.target.value)}
                            style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--line-strong)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)' }}
                          />
                        </div>
                      ) : (
                        <select
                          value={selected}
                          onChange={e => handleMappingChange(field, e.target.value)}
                          style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${isSet ? 'var(--pos)' : isMissing ? 'var(--neg)' : 'var(--line-strong)'}`, background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}
                        >
                          <option value="">— не выбрано —</option>
                          {pending.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unmapped columns */}
            {(() => {
              const used = new Set(Object.values(pending.mapping));
              const unmapped = pending.headers.filter(h => !used.has(h));
              return unmapped.length > 0 ? (
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>Неиспользованные колонки:</span>
                  {unmapped.map(h => <span key={h} className="pill" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{h}</span>)}
                </div>
              ) : null;
            })()}

            {error && (
              <div style={{ margin: '0 24px 16px', padding: '10px 14px', background: 'var(--neg-tint)', color: 'var(--neg)', borderRadius: 10, fontSize: 13.5 }}>
                {error}
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleApplyMapping}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                Применить маппинг и загрузить
              </button>
              <button className="btn" onClick={handleCancelMapping}>Отмена</button>
              <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginLeft: 8 }}>
                {pending.rawRows.length} строк будет импортировано
              </span>
            </div>
          </div>

          <DemoCard onLoad={handleDemoLoad} loaded={isDemoLoaded} />
          <ExportGuide />
        </div>
      )}

      {/* ── LOADED ── */}
      {stage === 'loaded' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3>Датасет загружен</h3>
                {batches.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {batches.map(b => (
                      <span key={b.id} className="pill pill-pos" style={{ fontSize: 12 }}>
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                        {b.fileName} · {b.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <span className="btn btn-sm">
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/></svg>
                  Добавить ещё CSV
                </span>
                <input type="file" accept=".csv" multiple onChange={handleFileSelect}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
              {[
                ['События', new Intl.NumberFormat('ru-RU').format(events.length)],
                ['Кейсы', stats.totalCases],
                ['Участники', stats.totalActors],
                ['Системы', systemsCount],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="sec-title">
            <h2>Превью</h2>
            <span className="sec-sub">первые 8 из {events.length} строк</span>
          </div>
          <div className="card" style={{ paddingBottom: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="t" style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }}>
                <thead><tr>
                  <th>case_id</th><th>activity</th><th>timestamp</th><th>actor</th><th>system</th>
                  <th style={{ textAlign: 'right' }}>duration</th>
                </tr></thead>
                <tbody>
                  {events.slice(0, 8).map((e, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--accent)' }}>{e.case_id}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{e.activity}</td>
                      <td style={{ color: 'var(--ink-muted)' }}>{e.timestamp}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{e.actor}</td>
                      <td style={{ color: 'var(--ink-muted)' }}>{e.system}</td>
                      <td style={{ textAlign: 'right' }}>{e.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ExportGuide />
        </div>
      )}
    </div>
  );
}

/* ── Export guide data ────────────────────────────────────── */
const EXPORT_GUIDES = [
  {
    id: 'jira', label: 'Jira', abbr: 'J', color: '#0052CC', bg: '#e6edff',
    steps: [
      'Откройте проект → Issues → перейдите в List View',
      'Нажмите Export → Export CSV (all fields) в правом верхнем углу',
      'В файле нужны колонки: Issue Key, Summary, Created, Assignee, Story Points',
    ],
    cols: 'Issue Key · Summary · Created · Assignee · Story Points',
  },
  {
    id: 'notion', label: 'Notion', abbr: 'N', color: '#191919', bg: '#f0f0f0',
    steps: [
      'Откройте базу данных в режиме таблицы (Table view)',
      'Нажмите ··· (три точки) в правом верхнем углу → Export → Export as CSV',
      'В базе должны быть поля: Name, Created time, Assign/Owner, Estimate (число, мин)',
    ],
    cols: 'ID · Name · Created time · Assign · Estimate',
  },
  {
    id: 'youtrack', label: 'YouTrack', abbr: 'YT', color: '#FF7500', bg: '#fff3e6',
    steps: [
      'Перейдите в раздел Issues → отфильтруйте нужные задачи',
      'Нажмите Export (иконка загрузки) → Export to CSV',
      'Выберите поля: Issue ID, Summary, Created, Assignee, Spent time',
    ],
    cols: 'Issue ID · Summary · Created · Assignee · Spent time',
  },
  {
    id: 'linear', label: 'Linear', abbr: 'LN', color: '#5E6AD2', bg: '#eeeffc',
    steps: [
      'Откройте Settings (шестерёнка) → Export → Issues',
      'Выберите нужную команду и временной диапазон',
      'CSV скачивается автоматически со всеми полями',
    ],
    cols: 'Identifier · Title · Created at · Assignee · Estimate',
  },
  {
    id: 'sheets', label: 'Google Sheets', abbr: 'GS', color: '#0F9D58', bg: '#e6f7ef',
    steps: [
      'Создайте таблицу — одна строка = одно событие PM-команды',
      'Колонки назовите как угодно: маппер сопоставит их сам',
      'File → Download → Comma Separated Values (.csv)',
    ],
    cols: 'Любые · маппер определит автоматически или вручную',
  },
  {
    id: 'confluence', label: 'Confluence', abbr: 'CF', color: '#0747A6', bg: '#e6eeff',
    steps: [
      'Space Settings → Content Report → выгрузите список страниц',
      'Или используйте REST API: /rest/api/content?spaceKey=PM&expand=history',
      'Нужные поля: ID, Title, Created, Author',
    ],
    cols: 'ID · Title · Created · Author · Version',
  },
];

function ExportGuide() {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
          color: 'var(--ink-muted)', fontSize: 13.5, fontWeight: 600,
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        Справка: как экспортировать CSV из вашей системы
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="card" style={{ paddingBottom: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-soft)', fontSize: 13, color: 'var(--ink-muted)' }}>
            Выберите платформу — посмотрите где найти нужные настройки и какие колонки включить в экспорт.
          </div>
          {EXPORT_GUIDES.map((g, i) => {
            const exp = expandedId === g.id;
            return (
              <div key={g.id} style={{ borderBottom: i < EXPORT_GUIDES.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <button
                  onClick={() => setExpandedId(exp ? null : g.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '14px 20px', background: exp ? g.bg + '66' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: exp ? g.color : g.bg, color: exp ? '#fff' : g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: g.abbr.length > 2 ? 9 : g.abbr.length > 1 ? 11 : 14, flexShrink: 0, transition: 'all .15s' }}>
                    {g.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{g.label}</div>
                    {!exp && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2, fontFamily: 'var(--f-mono)' }}>{g.cols}</div>}
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: exp ? 'rotate(180deg)' : 'none' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {exp && (
                  <div style={{ padding: '4px 20px 20px 66px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {g.steps.map((step, si) => (
                      <div key={si} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: g.bg, color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                          {si + 1}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>{step}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-muted)', fontFamily: 'var(--f-mono)' }}>
                      Колонки: <span style={{ color: g.color, fontWeight: 600 }}>{g.cols}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function UploadZone({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="card card-pad">
      <h3>Импорт CSV</h3>
      <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        Поддерживается любой CSV — Jira, Notion, YouTrack, Linear, Google Sheets и другие.
        После загрузки вы сопоставите колонки с нужными полями.
      </div>
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, textAlign: 'center', cursor: 'pointer',
        border: '2px dashed var(--line-strong)', borderRadius: 16,
        padding: '52px 24px', background: 'var(--surface-2)',
        position: 'relative', transition: 'background .15s',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Перетащите CSV сюда</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 6 }}>или кликните для выбора файла</div>
        </div>
        <input type="file" accept=".csv" onChange={onChange}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </label>
    </div>
  );
}

function DemoCard({ onLoad, loaded }: { onLoad: () => void; loaded: boolean }) {
  return (
    <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--warn-tint) 0%, #fff8ee 100%)' }}>
      <div className="eyebrow" style={{ color: 'var(--warn)' }}>Для тестирования</div>
      <h3 style={{ marginTop: 4 }}>Нет файла под рукой?</h3>
      <div style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>
        Демо-набор — реальный event log PM-команды: {DEMO_DATA.length} событий,{' '}
        {new Set(DEMO_DATA.map(e => e.case_id)).size} кейсов,{' '}
        {new Set(DEMO_DATA.map(e => e.actor)).size} участника.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={onLoad} disabled={loaded}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>
          {loaded ? 'Демо загружено' : 'Загрузить демо'}
        </button>
        {loaded && <Link href="/analysis"><a className="btn btn-sm">К AS-IS →</a></Link>}
      </div>
    </div>
  );
}
