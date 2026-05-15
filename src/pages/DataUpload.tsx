import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import Papa from 'papaparse';
import { DEMO_DATA, ProcessEvent } from '@/lib/demo-data';

/* ── Platform catalogue ───────────────────────────────────── */
interface PlatformInfo {
  id: string;
  label: string;
  abbr: string;
  color: string;
  bg: string;
  system: string;
  mini: string;
  cols: string;
  steps: string[];
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'universal', label: 'Universal CSV', abbr: 'CSV',
    color: '#229ED9', bg: '#e3f2fa', system: '',
    mini: 'CSV уже в нашей схеме — маппинг определится автоматически',
    cols: 'case_id · activity · timestamp · actor · system · duration',
    steps: [
      'Подготовьте CSV с 6 колонками (названия должны совпадать)',
      'timestamp должен быть в формате ISO 8601: 2026-04-12T09:15:00Z',
      'Загрузите файл — парсер проверит всё автоматически',
    ],
  },
  {
    id: 'jira', label: 'Jira', abbr: 'J',
    color: '#0052CC', bg: '#e6edff', system: 'Jira',
    mini: 'Issues → Export CSV (all fields) → нужны: Issue Key, Summary, Created, Assignee',
    cols: 'Issue Key · Summary · Created · Assignee · Story Points',
    steps: [
      'Откройте проект → Issues → List View',
      'Нажмите Export → Export CSV (all fields) в правом углу',
      'Нужные колонки: Issue Key, Summary, Created, Assignee, Story Points',
    ],
  },
  {
    id: 'notion', label: 'Notion', abbr: 'N',
    color: '#191919', bg: '#f0f0f0', system: 'Notion',
    mini: 'База данных → ··· → Export as CSV → нужны: Name, Created time, Assign',
    cols: 'ID · Name · Created time · Assign · Estimate',
    steps: [
      'Откройте базу данных в режиме таблицы (Table view)',
      'Нажмите ··· (три точки) → Export → Export as CSV',
      'В базе должны быть: Name, Created time, Assign/Owner, Estimate (мин)',
    ],
  },
  {
    id: 'youtrack', label: 'YouTrack', abbr: 'YT',
    color: '#FF7500', bg: '#fff3e6', system: 'YouTrack',
    mini: 'Issues → кнопка Export → Export to CSV → включить Spent time',
    cols: 'Issue ID · Summary · Created · Assignee · Spent time',
    steps: [
      'Перейдите в Issues → отфильтруйте нужные задачи',
      'Нажмите Export (иконка) → Export to CSV',
      'Включите поля: Issue ID, Summary, Created, Assignee, Spent time',
    ],
  },
  {
    id: 'linear', label: 'Linear', abbr: 'LN',
    color: '#5E6AD2', bg: '#eeeffc', system: 'Linear',
    mini: 'Settings → Export → Issues → выбрать команду → скачать',
    cols: 'Identifier · Title · Created at · Assignee · Estimate',
    steps: [
      'Откройте Settings (шестерёнка) → Export → Issues',
      'Выберите команду и временной диапазон',
      'CSV скачается автоматически со всеми полями',
    ],
  },
  {
    id: 'sheets', label: 'Google Sheets', abbr: 'GS',
    color: '#0F9D58', bg: '#e6f7ef', system: '',
    mini: 'File → Download → CSV · Колонки — любые, маппер сопоставит вручную',
    cols: 'Любые — маппер сопоставит самостоятельно',
    steps: [
      'Одна строка = одно событие PM-команды',
      'Колонки назовите как угодно — маппер предложит сопоставление',
      'File → Download → Comma Separated Values (.csv)',
    ],
  },
  {
    id: 'confluence', label: 'Confluence', abbr: 'CF',
    color: '#0747A6', bg: '#e6eeff', system: 'Confluence',
    mini: 'Space Settings → Content Report → Export или REST API /rest/api/content',
    cols: 'ID · Title · Created · Author · Version',
    steps: [
      'Space Settings → Content Report → список страниц',
      'Или REST API: /rest/api/content?spaceKey=PM&expand=history',
      'Нужные поля: ID, Title, Created, Author',
    ],
  },
];

/* ── Auto-detection hints ─────────────────────────────────── */
const FIELD_HINTS: Record<string, string[]> = {
  case_id:   ['case_id', 'caseid', 'id', 'issue key', 'issue_key', 'identifier', 'key', 'номер', 'кейс', 'проект'],
  activity:  ['activity', 'summary', 'title', 'name', 'task', 'subject', 'задача', 'название', 'активность'],
  timestamp: ['timestamp', 'created', 'date', 'created_at', 'createdat', 'time', 'started', 'дата', 'время', 'создан'],
  actor:     ['actor', 'assignee', 'owner', 'author', 'assign', 'user', 'исполнитель', 'автор', 'участник'],
  system:    ['system', 'platform', 'source', 'project', 'tool', 'систем', 'источник', 'платформ'],
  duration:  ['duration', 'story points', 'storypoints', 'estimate', 'spent', 'time spent', 'minutes', 'длительность', 'минуты', 'оценка'],
};

const FIELD_META: Record<string, { label: string; desc: string; required: boolean }> = {
  case_id:   { label: 'case_id',   desc: 'Идентификатор кейса или процесса',       required: true  },
  activity:  { label: 'activity',  desc: 'Название активности или шага',            required: true  },
  timestamp: { label: 'timestamp', desc: 'Дата и время события',                    required: true  },
  actor:     { label: 'actor',     desc: 'Исполнитель или роль',                    required: true  },
  system:    { label: 'system',    desc: 'Источник события (можно задать вручную)',  required: false },
  duration:  { label: 'duration',  desc: 'Длительность в минутах',                 required: true  },
};

const FIELD_ORDER = ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'];

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();
  for (const field of FIELD_ORDER) {
    for (const header of headers) {
      if (used.has(header)) continue;
      if (FIELD_HINTS[field].some(hint => header.toLowerCase().includes(hint.toLowerCase()))) {
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
  fileName: string;
  headers: string[];
  rawRows: any[];
  mapping: Record<string, string>;
  systemFallback: string;
  platformId: string;
}

interface ImportBatch {
  id: string;
  fileName: string;
  count: number;
}

/* ── Main component ───────────────────────────────────────── */
export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();

  const [stage, setStage] = useState<Stage>(events.length > 0 ? 'loaded' : 'idle');
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [lastPending, setLastPending] = useState<PendingFile | null>(null);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState('universal');

  const platform = PLATFORMS.find(p => p.id === platformId) ?? PLATFORMS[0];
  const stats = analyzer.basicStats;
  const systemsCount = new Set(events.map(e => e.system)).size;

  /* ── Parse one file ─────────────────────────────────────── */
  const parseFile = (file: File, filePlatformId: string) => {
    setError(null);
    const filePlatform = PLATFORMS.find(p => p.id === filePlatformId) ?? PLATFORMS[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        if (!headers.length) { setError('Не удалось прочитать заголовки CSV.'); return; }
        const pf: PendingFile = {
          fileName: file.name,
          headers,
          rawRows: results.data as any[],
          mapping: autoDetect(headers),
          systemFallback: filePlatform.system,
          platformId: filePlatformId,
        };
        setPending(pf);
        setStage('mapping');
      },
      error: (err) => setError(`Ошибка чтения: ${err.message}`),
    });
  };

  /* ── File upload ────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    const [first, ...rest] = files;
    setFileQueue(rest);
    parseFile(first, platformId);
  };

  /* ── Mapping ────────────────────────────────────────────── */
  const handleMappingChange = (field: string, col: string) =>
    setPending(p => p ? { ...p, mapping: { ...p.mapping, [field]: col } } : p);

  const handleSystemFallback = (val: string) =>
    setPending(p => p ? { ...p, systemFallback: val } : p);

  const handleApplyMapping = () => {
    if (!pending) return;
    const { rawRows, mapping, systemFallback, fileName } = pending;

    const missing = FIELD_ORDER.filter(f => FIELD_META[f].required && !mapping[f]);
    if (missing.length) { setError(`Сопоставьте обязательные поля: ${missing.join(', ')}`); return; }

    const durations = rawRows.map(r => Number(r[mapping.duration])).filter(d => isFinite(d) && d > 0);
    const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 30;

    const parsed: ProcessEvent[] = rawRows.map(r => ({
      case_id:   String(r[mapping.case_id]   ?? ''),
      activity:  String(r[mapping.activity]   ?? ''),
      timestamp: String(r[mapping.timestamp]  ?? ''),
      actor:     String(r[mapping.actor]      ?? ''),
      system:    mapping.system ? (String(r[mapping.system] ?? '') || systemFallback || 'Unknown') : (systemFallback || 'Unknown'),
      duration:  Number(r[mapping.duration])  || avgDur,
    })).filter(e => e.case_id && e.activity);

    if (!parsed.length) { setError('После маппинга нет валидных строк. Проверьте колонки.'); return; }

    setEvents(stage === 'loaded' ? [...events, ...parsed] : parsed);
    setLastPending(pending);
    setBatches(prev => [...(stage === 'loaded' || fileQueue.length > 0 ? prev : []), { id: `${fileName}-${Date.now()}`, fileName, count: parsed.length }]);
    setIsDemoLoaded(false);
    setError(null);

    if (fileQueue.length > 0) {
      const [next, ...rest] = fileQueue;
      setFileQueue(rest);
      parseFile(next, 'universal');
    } else {
      setPending(null);
      setStage('loaded');
    }
  };

  const handleEditMapping = () => {
    if (!lastPending) return;
    setPending({ ...lastPending, mapping: autoDetect(lastPending.headers) });
    setStage('mapping');
  };

  const handleCancelMapping = () => {
    setFileQueue([]);
    setPending(null);
    setError(null);
    setStage(events.length > 0 ? 'loaded' : 'idle');
  };

  /* ── Demo / clear ───────────────────────────────────────── */
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
    setLastPending(null);
    setBatches([]);
    setError(null);
  };

  const handleExport = () => {
    if (!events.length) return;
    const csv = Papa.unparse(events.map(e => ({ case_id: e.case_id, activity: e.activity, timestamp: e.timestamp, actor: e.actor, system: e.system, duration: e.duration })));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'combined-event-log.csv';
    a.click();
  };

  /* ── Render ───────────────────────────────────────────────  */
  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 0 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1>Данные</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 580, fontSize: 15, lineHeight: 1.55 }}>
            Загрузите CSV из любого источника. Выберите платформу — маппер предложит правильное сопоставление колонок.
          </div>
        </div>
        {stage === 'loaded' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lastPending && (
              <button className="btn btn-sm" onClick={handleEditMapping}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Изменить маппинг
              </button>
            )}
            <button className="btn btn-sm" onClick={handleClear}>Сбросить</button>
            <button className="btn btn-sm" onClick={handleExport}>Скачать CSV</button>
            <Link href="/analysis"><a className="btn btn-primary btn-sm">К AS-IS →</a></Link>
          </div>
        )}
      </div>

      {/* Platform selector — global in idle/loaded, per-file in mapping */}
      <PlatformSelector
        selected={stage === 'mapping' && pending ? pending.platformId : platformId}
        onChange={id => {
          if (stage === 'mapping') {
            const p = PLATFORMS.find(x => x.id === id);
            setPending(pf => pf ? {
              ...pf,
              platformId: id,
              systemFallback: p?.system ?? '',
              mapping: autoDetect(pf.headers),
            } : pf);
          } else {
            setPlatformId(id);
          }
        }}
      />

      {/* ── IDLE ── */}
      {stage === 'idle' && (
        <>
          <div className="grid-asym" style={{ alignItems: 'start', marginTop: 16 }}>
            <UploadZone platform={platform} onChange={handleFileSelect} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DemoCard onLoad={handleDemoLoad} loaded={isDemoLoaded} />
            </div>
          </div>
        </>
      )}

      {/* ── MAPPING ── */}
      {stage === 'mapping' && pending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {/* File banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: 'var(--accent-soft)', borderRadius: 14, border: '1px solid var(--accent-tint)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                {pending.fileName}
                {fileQueue.length > 0 && (
                  <span className="pill" style={{ fontSize: 11, background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                    ещё {fileQueue.length} в очереди
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                {pending.headers.length} колонок · {pending.rawRows.length} строк
                · {Object.values(pending.mapping).filter(Boolean).length} из {FIELD_ORDER.length} определены автоматически
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleCancelMapping}>Отмена</button>
          </div>

          {/* Mapper */}
          <div className="card">
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line-soft)' }}>
              <h3>Сопоставление колонок</h3>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
                Зелёные поля определены автоматически. Остальные — выберите из дропдауна.
              </div>
            </div>

            {FIELD_ORDER.map(field => {
              const meta = FIELD_META[field];
              const selected = pending.mapping[field] ?? '';
              const detected = Boolean(autoDetect(pending.headers)[field]);
              const isSet = Boolean(selected);
              const isMissing = meta.required && !isSet;

              return (
                <div key={field} style={{
                  display: 'grid', gridTemplateColumns: '200px 1fr 280px',
                  gap: 16, alignItems: 'center', padding: '13px 24px',
                  borderBottom: '1px solid var(--line-soft)',
                  background: isMissing ? '#fff5f5' : undefined,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: isSet ? 'var(--accent-soft)' : isMissing ? 'var(--neg-tint)' : 'var(--bg)', color: isSet ? 'var(--accent-2)' : isMissing ? 'var(--neg)' : 'var(--ink-muted)', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12.5, fontFamily: 'var(--f-mono)' }}>
                        {meta.label}
                      </span>
                      {!meta.required && <span className="pill" style={{ fontSize: 11 }}>необязательное</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 5 }}>{meta.desc}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {isSet && detected && <span className="pill pill-pos" style={{ fontSize: 11.5 }}>✓ автоопределено</span>}
                    {isSet && !detected && <span className="pill" style={{ fontSize: 11.5, background: 'var(--warn-tint)', color: 'var(--warn)' }}>вручную</span>}
                    {!isSet && isMissing && <span className="pill pill-neg" style={{ fontSize: 11.5 }}>обязательное</span>}
                    {!isSet && !isMissing && <span className="pill" style={{ fontSize: 11.5 }}>не выбрано</span>}
                    {field === 'system' && !selected && (() => {
                      const fp = PLATFORMS.find(x => x.id === pending.platformId) ?? PLATFORMS[0];
                      return fp.system && pending.systemFallback === fp.system
                        ? <span className="pill" style={{ fontSize: 11, background: fp.bg, color: fp.color }}>← из платформы</span>
                        : null;
                    })()}
                  </div>

                  <div>
                    {field === 'system' && !selected ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select value="" onChange={e => { if (e.target.value) handleMappingChange(field, e.target.value); }}
                          style={selectStyle('#d4d4d8')}>
                          <option value="">— из колонки CSV —</option>
                          {pending.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <input placeholder={(PLATFORMS.find(x => x.id === pending.platformId) ?? PLATFORMS[0]).system || 'Jira, Slack…'} value={pending.systemFallback}
                          onChange={e => handleSystemFallback(e.target.value)}
                          style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--line-strong)', background: 'var(--surface)', fontSize: 13 }} />
                      </div>
                    ) : (
                      <select value={selected} onChange={e => handleMappingChange(field, e.target.value)}
                        style={selectStyle(isSet ? 'var(--pos)' : isMissing ? 'var(--neg)' : 'var(--line-strong)')}>
                        <option value="">— не выбрано —</option>
                        {pending.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unmapped */}
            {(() => {
              const used = new Set(Object.values(pending.mapping));
              const unused = pending.headers.filter(h => !used.has(h));
              return unused.length > 0 ? (
                <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>Игнорируются:</span>
                  {unused.map(h => <span key={h} className="pill" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{h}</span>)}
                </div>
              ) : null;
            })()}

            {error && (
              <div style={{ margin: '0 24px 12px', padding: '10px 14px', background: 'var(--neg-tint)', color: 'var(--neg)', borderRadius: 10, fontSize: 13.5 }}>{error}</div>
            )}

            <div style={{ padding: '14px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleApplyMapping}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                Применить и загрузить
              </button>
              <button className="btn" onClick={handleCancelMapping}>Отмена</button>
              <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginLeft: 4 }}>{pending.rawRows.length} строк</span>
            </div>
          </div>

          <DemoCard onLoad={handleDemoLoad} loaded={isDemoLoaded} />
        </div>
      )}

      {/* ── LOADED ── */}
      {stage === 'loaded' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3>Датасет загружен</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {batches.map(b => (
                    <span key={b.id} className="pill pill-pos" style={{ fontSize: 12 }}>
                      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                      {b.fileName} · {b.count}
                    </span>
                  ))}
                </div>
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

        </div>
      )}
    </div>
  );
}

/* ── Helper ───────────────────────────────────────────────── */
function selectStyle(borderColor: string): React.CSSProperties {
  return { width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${borderColor}`, background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' };
}

/* ── Platform selector ────────────────────────────────────── */
function PlatformSelector({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  const platform = PLATFORMS.find(p => p.id === selected) ?? PLATFORMS[0];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PLATFORMS.map(p => {
          const active = p.id === selected;
          return (
            <button key={p.id} onClick={() => onChange(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px',
              background: active ? p.color : 'var(--surface)',
              color: active ? '#fff' : 'var(--ink-3)',
              border: 'none', borderRadius: 999, fontWeight: 600, fontSize: 13,
              cursor: 'pointer', boxShadow: 'var(--sh-1)', transition: 'all .15s',
            }}>
              <span style={{ fontWeight: 700, fontSize: p.abbr.length > 2 ? 10 : 12 }}>{p.abbr}</span>
              {p.label}
            </button>
          );
        })}
      </div>
      {/* Steps for selected platform */}
      <div style={{ marginTop: 10, padding: '14px 18px', background: platform.bg, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {platform.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: platform.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>{step}</div>
          </div>
        ))}
        {platform.cols && (
          <div style={{ marginTop: 4, padding: '6px 10px', background: '#fff5', borderRadius: 8, fontSize: 12, color: platform.color, fontFamily: 'var(--f-mono)', fontWeight: 600 }}>
            {platform.cols}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Upload zone ──────────────────────────────────────────── */
function UploadZone({ platform, onChange }: { platform: PlatformInfo; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="card card-pad">
      <h3>Импорт CSV</h3>
      <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        После загрузки откроется маппер — сопоставите колонки вашего файла с нужными полями.
      </div>
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, textAlign: 'center', cursor: 'pointer',
        border: `2px dashed ${platform.color}55`, borderRadius: 16,
        padding: '52px 24px', background: platform.bg + '44',
        position: 'relative',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: platform.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={platform.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Перетащите CSV сюда</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 6 }}>или кликните для выбора файла</div>
        </div>
        <input type="file" accept=".csv" multiple onChange={onChange}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </label>
    </div>
  );
}

/* ── Demo card ────────────────────────────────────────────── */
function DemoCard({ onLoad, loaded }: { onLoad: () => void; loaded: boolean }) {
  return (
    <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--warn-tint) 0%, #fff8ee 100%)' }}>
      <div className="eyebrow" style={{ color: 'var(--warn)' }}>Для тестирования</div>
      <h3 style={{ marginTop: 4 }}>Нет файла под рукой?</h3>
      <div style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>
        Демо-набор: {DEMO_DATA.length} событий · {new Set(DEMO_DATA.map(e => e.case_id)).size} кейсов · {new Set(DEMO_DATA.map(e => e.actor)).size} участника.
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

/* ── Collapsible export guide ─────────────────────────────── */
function ExportGuide() {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
        color: 'var(--ink-muted)', fontSize: 13.5, fontWeight: 600,
      }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        Справка: как экспортировать CSV из вашей системы
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: 'auto', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="card" style={{ paddingBottom: 0 }}>
          {PLATFORMS.filter(p => p.id !== 'universal').map((p, i, arr) => {
            const exp = expandedId === p.id;
            return (
              <div key={p.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <button onClick={() => setExpandedId(exp ? null : p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '13px 20px', background: exp ? p.bg + '88' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: exp ? p.color : p.bg, color: exp ? '#fff' : p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: p.abbr.length > 2 ? 9 : 11, flexShrink: 0, transition: 'all .15s' }}>
                    {p.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{p.label}</span>
                    {!exp && <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--f-mono)' }}>{p.cols}</span>}
                  </div>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transition: 'transform .2s', transform: exp ? 'rotate(180deg)' : 'none' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {exp && (
                  <div style={{ padding: '2px 20px 18px 62px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {p.steps.map((step, si) => (
                      <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                          {si + 1}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>{step}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 4, padding: '7px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-muted)', fontFamily: 'var(--f-mono)' }}>
                      Колонки: <span style={{ color: p.color, fontWeight: 600 }}>{p.cols}</span>
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
