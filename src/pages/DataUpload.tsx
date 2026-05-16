import React, { useState, useEffect, useRef } from 'react';
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
      'Убедитесь, что первая строка файла — заголовки колонок',
      'Формат дат — ISO 8601: 2024-04-12T09:15:00 или 2024-04-12',
      'Загрузите файл — маппер сопоставит колонки автоматически',
    ],
  },
  {
    id: 'jira', label: 'Jira', abbr: 'J',
    color: '#0052CC', bg: '#e6edff', system: 'Jira',
    mini: 'Issues → Export CSV (all fields) → нужны: Issue Key, Summary, Created, Assignee',
    cols: 'Issue Key · Summary · Created · Assignee · Story Points',
    steps: [
      'Откройте проект → в левом меню выберите Issues',
      'В правом верхнем углу нажмите Export → Export CSV (all fields)',
      'Колонки для маппинга: Issue Key, Summary, Created, Assignee, Story Points',
    ],
  },
  {
    id: 'notion', label: 'Notion', abbr: 'N',
    color: '#191919', bg: '#f0f0f0', system: 'Notion',
    mini: 'База данных → ··· → Export as CSV → нужны: Name, Created time, Assign',
    cols: 'Name · Created time · Assignee · Estimate',
    steps: [
      'Откройте базу данных → нажмите ··· (три точки) в правом верхнем углу',
      'Export → Export format: CSV → снимите галку Include subpages → Export',
      'Нужные свойства в базе: Name, Created time, Assignee (Person), Estimate',
    ],
  },
  {
    id: 'youtrack', label: 'YouTrack', abbr: 'YT',
    color: '#FF7500', bg: '#fff3e6', system: 'YouTrack',
    mini: 'Issues → кнопка Export → Export to CSV → включить Spent time',
    cols: 'Issue ID · Summary · Created · Assignee · Spent time',
    steps: [
      'Issues → выберите проект в фильтре слева, настройте нужные условия',
      'Нажмите иконку ↓ Export вверху списка → Export as CSV',
      'В диалоге отметьте поля: Issue ID, Summary, Created, Assignee, Spent time',
    ],
  },
  {
    id: 'linear', label: 'Linear', abbr: 'LN',
    color: '#5E6AD2', bg: '#eeeffc', system: 'Linear',
    mini: 'Команда → ··· → Export → CSV',
    cols: 'Identifier · Title · Created at · Assignee · Estimate',
    steps: [
      'В левом меню откройте нужную команду (Team)',
      'Нажмите ··· рядом с названием команды → Export → Export as CSV',
      'Колонки в файле: Identifier, Title, Created at, Assignee, Estimate',
    ],
  },
  {
    id: 'sheets', label: 'Google Sheets', abbr: 'GS',
    color: '#0F9D58', bg: '#e6f7ef', system: '',
    mini: 'File → Download → CSV · Колонки — любые, маппер сопоставит вручную',
    cols: 'Любые — маппер сопоставит самостоятельно',
    steps: [
      'Каждая строка таблицы — отдельная задача или событие, первая строка — заголовки',
      'Колонки называйте как угодно — маппер предложит сопоставление',
      'Файл → Скачать → Comma Separated Values (.csv, текущий лист)',
    ],
  },
  {
    id: 'confluence', label: 'Confluence', abbr: 'CF',
    color: '#0747A6', bg: '#e6eeff', system: 'Confluence',
    mini: 'Space Settings → Content Report → Export',
    cols: 'ID · Title · Created · Author · Version',
    steps: [
      'Откройте пространство → Space Settings → Manage Space → Content',
      'В разделе Content Report нажмите Export → выберите CSV',
      'Нужные поля: Page ID, Title, Created Date, Creator, Version',
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

const FIELD_ORDER = ['case_id', 'activity', 'timestamp', 'actor', 'duration', 'system'];

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
  pending: PendingFile;
  events: ProcessEvent[];
}

const BATCHES_KEY = 'pm-analyzer-batches';

/* ── Main component ───────────────────────────────────────── */
export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();

  const [stage, setStage] = useState<Stage>(events.length > 0 ? 'loaded' : 'idle');
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>(() => {
    try {
      const saved = localStorage.getItem(BATCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState('universal');
  const batchesRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const platform = PLATFORMS.find(p => p.id === platformId) ?? PLATFORMS[0];
  const stats = analyzer.basicStats;
  const systemsCount = new Set(events.map(e => e.system)).size;

  const rebuildEvents = (bs: ImportBatch[]) => bs.flatMap(b => b.events);

  // If events exist in DataContext but batches is empty (stale localStorage), wipe everything
  useEffect(() => {
    if (events.length > 0 && batches.length === 0) {
      clearData();
      setStage('idle');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      if (batches.length > 0) {
        const slim = batches.map(b => ({ ...b, pending: { ...b.pending, rawRows: [] } }));
        localStorage.setItem(BATCHES_KEY, JSON.stringify(slim));
      } else {
        localStorage.removeItem(BATCHES_KEY);
      }
    } catch {}
  }, [batches]);

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

  const parsePending = (pf: PendingFile): ProcessEvent[] | null => {
    const { rawRows, mapping, systemFallback } = pf;
    const missing = FIELD_ORDER.filter(f => FIELD_META[f].required && !mapping[f]);
    if (missing.length) { setError(`Сопоставьте обязательные поля: ${missing.join(', ')}`); return null; }
    const durations = rawRows.map(r => Number(r[mapping.duration])).filter(d => isFinite(d) && d > 0);
    const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 30;
    const parsed = rawRows.map(r => ({
      case_id:   String(r[mapping.case_id]   ?? ''),
      activity:  String(r[mapping.activity]   ?? ''),
      timestamp: String(r[mapping.timestamp]  ?? ''),
      actor:     String(r[mapping.actor]      ?? ''),
      system:    mapping.system ? (String(r[mapping.system] ?? '') || systemFallback || 'Unknown') : (systemFallback || 'Unknown'),
      duration:  Number(r[mapping.duration])  || avgDur,
    })).filter(e => e.case_id && e.activity);
    if (!parsed.length) { setError('После маппинга нет валидных строк. Проверьте колонки.'); return null; }
    return parsed;
  };

  const handleApplyMapping = () => {
    if (!pending) return;
    const parsed = parsePending(pending);
    if (!parsed) return;

    let newBatches: ImportBatch[];
    if (editingBatchId) {
      newBatches = batches.map(b =>
        b.id === editingBatchId
          ? { ...b, count: parsed.length, pending, events: parsed }
          : b
      );
      setEditingBatchId(null);
      setBatches(newBatches);
      setEvents(rebuildEvents(newBatches));
      setPending(null);
      setStage('loaded');
      setError(null);
      setTimeout(() => batchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }

    const newBatch: ImportBatch = { id: `${pending.fileName}-${Date.now()}`, fileName: pending.fileName, count: parsed.length, pending, events: parsed };
    newBatches = batches.length > 0 || fileQueue.length > 0 ? [...batches, newBatch] : [newBatch];
    setBatches(newBatches);
    setEvents(rebuildEvents(newBatches));
    setIsDemoLoaded(false);
    setError(null);

    if (fileQueue.length > 0) {
      const [next, ...rest] = fileQueue;
      setFileQueue(rest);
      parseFile(next, 'universal');
    } else {
      setPending(null);
      setStage('loaded');
      setTimeout(() => batchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  const handleEditMapping = (batch: ImportBatch) => {
    setEditingBatchId(batch.id);
    setPending({ ...batch.pending, mapping: autoDetect(batch.pending.headers) });
    setStage('mapping');
  };

  const handleRemoveBatch = (batchId: string) => {
    const newBatches = batches.filter(b => b.id !== batchId);
    setBatches(newBatches);
    if (newBatches.length === 0) {
      clearData();
      setIsDemoLoaded(false);
      setStage('idle');
    } else {
      setEvents(rebuildEvents(newBatches));
    }
  };

  const handleCancelMapping = () => {
    setFileQueue([]);
    setPending(null);
    setEditingBatchId(null);
    setError(null);
    setStage(events.length > 0 ? 'loaded' : 'idle');
  };

  /* ── Demo / clear ───────────────────────────────────────── */
  const handleDemoLoad = () => {
    if (isDemoLoaded) return;
    loadDemoData();
    setIsDemoLoaded(true);
    setStage('loaded');
    const demoBatch: ImportBatch = { id: 'demo', fileName: 'demo-event-log.csv', count: DEMO_DATA.length, events: DEMO_DATA, pending: { fileName: 'demo-event-log.csv', headers: [], rawRows: [], mapping: {}, systemFallback: '', platformId: 'universal' } };
    setBatches([demoBatch]);
    setPending(null);
    setError(null);
  };

  const handleClear = () => {
    clearData();
    setIsDemoLoaded(false);
    setStage('idle');
    setPending(null);
    setEditingBatchId(null);
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
      </div>

      {/* Platform selector — global in idle/loaded, per-file in mapping */}
      {stage !== 'mapping' && (
        <>
          <StepLabel n={1} title="Выберите платформу" subtitle="Шаги экспорта и нужные колонки обновятся автоматически" />
          <PlatformSelector
            selected={platformId}
            onChange={id => setPlatformId(id)}
          />
        </>
      )}

      {/* ── STEP 2: upload — shown in idle and loaded ── */}
      {stage !== 'mapping' && (
        <div ref={uploadRef}>
          <StepLabel
            n={2}
            title="Загрузите CSV-файл"
            subtitle="Можно выбрать несколько файлов сразу — каждый пройдёт через маппер"
            style={{ marginTop: 20 }}
          />
          {batches.length === 0 ? (
            <div className="grid-asym" style={{ alignItems: 'stretch', marginTop: 10 }}>
              <UploadZone platform={platform} onChange={handleFileSelect} />
              <DemoCard onLoad={handleDemoLoad} loaded={isDemoLoaded} />
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <UploadZone platform={platform} onChange={handleFileSelect} fullWidth />
            </div>
          )}
        </div>
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
                {editingBatchId
                  ? <><span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>Редактирование:</span> {pending.fileName}</>
                  : pending.fileName}
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
                  background: isMissing ? '#fff5f5' : !meta.required ? 'var(--bg)' : undefined,
                  opacity: !meta.required ? 0.75 : 1,
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
                    {field === 'system' && !selected && (() => {
                      const fp = PLATFORMS.find(x => x.id === pending.platformId) ?? PLATFORMS[0];
                      return fp.system && pending.systemFallback === fp.system
                        ? <span className="pill" style={{ fontSize: 11, background: fp.bg, color: fp.color }}>← из платформы</span>
                        : null;
                    })()}
                  </div>

                  <div>
                    {field === 'system' ? (
                      <input placeholder={(PLATFORMS.find(x => x.id === pending.platformId) ?? PLATFORMS[0]).system || 'Jira, Slack…'} value={pending.systemFallback}
                        onChange={e => handleSystemFallback(e.target.value)}
                        style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--line-strong)', background: 'var(--surface)', fontSize: 13, boxSizing: 'border-box' }} />
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

        </div>
      )}

      {/* ── LOADED ── */}
      {stage === 'loaded' && (
        <div ref={batchesRef} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Загруженные файлы
            </div>
            {/* Batch list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {batches.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--pos-tint, #edfaf3)', borderRadius: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--pos)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                  </div>
                  <div style={{ flex: 1, fontSize: 13.5, fontFamily: 'var(--f-mono)' }}>
                    {b.fileName}
                    <span style={{ color: 'var(--ink-muted)', marginLeft: 8 }}>{b.count} строк</span>
                  </div>
                  {b.pending.headers.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditMapping(b)}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Изменить маппинг
                    </button>
                  )}
                  <div style={{ width: 1, height: 18, background: 'var(--line-soft)', margin: '0 2px', flexShrink: 0 }} />
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neg)' }}
                    onClick={() => { if (window.confirm(`Удалить «${b.fileName}»? Его события исчезнут из датасета.`)) handleRemoveBatch(b.id); }}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-soft)', border: '1.5px solid var(--accent-tint)', color: 'var(--accent)', fontWeight: 600 }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                Загрузить данные из другой платформы
              </button>
              <span style={{ color: 'var(--ink-faint)', marginLeft: 8, fontSize: 12.5 }}>— анализ объединит всё вместе</span>
            </div>

          </div>

          <div className="sec-title" style={{ marginTop: 8 }}>
            <h2>Превью данных</h2>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                ['События', new Intl.NumberFormat('ru-RU').format(events.length)],
                ['Кейсы', stats.totalCases],
                ['Участники', stats.totalActors],
                ['Системы', systemsCount],
              ].map(([k, v]) => (
                <span key={String(k)} className="pill" style={{ fontSize: 12, padding: '3px 9px' }}>
                  <span style={{ color: 'var(--ink-muted)', marginRight: 4 }}>{k}</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{v}</span>
                </span>
              ))}
            </div>
            <button className="btn btn-sm" onClick={handleExport} style={{ marginLeft: 'auto' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6" transform="rotate(180 12 12)"/></svg>
              Скачать CSV
            </button>
          </div>
          <PreviewTable events={events} />

        </div>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function selectStyle(borderColor: string): React.CSSProperties {
  return { width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${borderColor}`, background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' };
}

function StepLabel({ n, title, subtitle, style }: { n: number; title: string; subtitle: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, ...style }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
      <div>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{title}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginLeft: 8 }}>{subtitle}</span>
      </div>
    </div>
  );
}

/* ── Preview table with pagination ───────────────────────── */
const PAGE_SIZE = 10;

function PreviewTable({ events }: { events: ProcessEvent[] }) {
  const [page, setPage] = useState(0);
  const total = events.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const rows = events.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="card" style={{ paddingBottom: 0 }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="t" style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }}>
          <thead><tr>
            <th>case_id</th><th>activity</th><th>timestamp</th><th>actor</th><th>system</th>
            <th style={{ textAlign: 'right' }}>duration</th>
          </tr></thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={page * PAGE_SIZE + i}>
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
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid var(--line-soft)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            {new Intl.NumberFormat('ru-RU').format(from)}–{new Intl.NumberFormat('ru-RU').format(to)} из {new Intl.NumberFormat('ru-RU').format(total)}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(0)} disabled={page === 0} style={{ padding: '0 8px' }}>«</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{ padding: '0 10px' }}>‹</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--ink-muted)', padding: '0 8px' }}>{page + 1} / {pages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} style={{ padding: '0 10px' }}>›</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(pages - 1)} disabled={page >= pages - 1} style={{ padding: '0 8px' }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
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
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: platform.color, flexShrink: 0, marginTop: 8 }} />
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
function UploadZone({ platform, onChange, fullWidth }: { platform: PlatformInfo; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; fullWidth?: boolean }) {
  return (
    <div className="card card-pad" style={fullWidth ? { width: '100%' } : undefined}>
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
    <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--warn-tint) 0%, #fff8ee 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
