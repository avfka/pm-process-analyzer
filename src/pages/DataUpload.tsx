import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import Papa from 'papaparse';
import { DEMO_DATA, ProcessEvent } from '@/lib/demo-data';

interface Platform {
  id: string;
  label: string;
  abbr: string;
  color: string;
  bg: string;
  hint: string;
  steps: string[];
  mapping: [string, string, string][];
  sampleHeaders: string[];
  sample: (string | number)[];
}

const PLATFORMS: Platform[] = [
  {
    id: 'universal',
    label: 'Universal CSV',
    abbr: 'CSV',
    color: '#229ED9',
    bg: '#e3f2fa',
    hint: 'Готовый event log по нашей схеме',
    steps: [
      'Подготовьте CSV с 6 колонками по схеме маппинга',
      'Убедитесь что timestamp в формате ISO 8601 (2026-04-12T09:15:00Z)',
      'Загрузите — парсер проверит структуру автоматически',
    ],
    mapping: [
      ['case_id',   'case_id',   'Идентификатор процесса или кейса'],
      ['activity',  'activity',  'Название активности или шага'],
      ['timestamp', 'timestamp', 'Дата и время события (ISO 8601)'],
      ['actor',     'actor',     'Исполнитель или роль'],
      ['system',    'system',    'Источник события или платформа'],
      ['duration',  'duration',  'Длительность в минутах'],
    ],
    sampleHeaders: ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'],
    sample: ['CASE-1024', 'Подготовка отчёта', '2026-04-12T09:15:00Z', 'PM-Anna', 'Jira', 38],
  },
  {
    id: 'jira',
    label: 'Jira',
    abbr: 'J',
    color: '#0052CC',
    bg: '#e6edff',
    hint: 'Issue tracker — задачи и статусы',
    steps: [
      'Откройте проект → Issues → перейдите в List View',
      'Нажмите Export → Export CSV (all fields)',
      'Включите поля: Issue Key, Summary, Created, Assignee, Story Points',
    ],
    mapping: [
      ['Issue Key',             'case_id',   'Номер задачи (PM-1024)'],
      ['Summary',               'activity',  'Название задачи'],
      ['Created',               'timestamp', 'Дата создания задачи'],
      ['Assignee',              'actor',     'Исполнитель'],
      ['—',                     'system',    'Подставляется автоматически: "Jira"'],
      ['Story Points / Logged', 'duration',  'Оценка × 30 мин или залогированное время'],
    ],
    sampleHeaders: ['Issue Key', 'Summary', 'Created', 'Assignee', 'system', 'Story Points'],
    sample: ['PM-1024', 'Подготовка статус-отчёта', '12/Apr/26 9:15 AM', 'anna.k', 'Jira', 38],
  },
  {
    id: 'youtrack',
    label: 'YouTrack',
    abbr: 'YT',
    color: '#FF7500',
    bg: '#fff3e6',
    hint: 'Issue tracker с учётом времени',
    steps: [
      'Перейдите в Issues → отфильтруйте нужные задачи',
      'Нажмите Export → Export to CSV',
      'Включите поля: Issue ID, Summary, Created, Assignee, Spent time',
    ],
    mapping: [
      ['Issue ID',   'case_id',   'Идентификатор задачи'],
      ['Summary',    'activity',  'Название задачи'],
      ['Created',    'timestamp', 'Дата создания'],
      ['Assignee',   'actor',     'Исполнитель'],
      ['—',          'system',    'Подставляется автоматически: "YouTrack"'],
      ['Spent time', 'duration',  'Затраченное время в минутах'],
    ],
    sampleHeaders: ['Issue ID', 'Summary', 'Created', 'Assignee', 'system', 'Spent time'],
    sample: ['PM-1024', 'Sprint review подготовка', '2026-04-12T10:00:00', 'mark.v', 'YouTrack', 45],
  },
  {
    id: 'linear',
    label: 'Linear',
    abbr: 'LN',
    color: '#5E6AD2',
    bg: '#eeeffc',
    hint: 'Современный issue tracker',
    steps: [
      'Откройте Settings → Export → Issues',
      'Выберите нужные команды и временной диапазон',
      'Скачайте CSV — все поля экспортируются автоматически',
    ],
    mapping: [
      ['Identifier', 'case_id',   'ID задачи (ENG-123)'],
      ['Title',      'activity',  'Название задачи'],
      ['Created at', 'timestamp', 'Дата создания в ISO 8601'],
      ['Assignee',   'actor',     'Исполнитель'],
      ['—',          'system',    'Подставляется автоматически: "Linear"'],
      ['Estimate',   'duration',  'Оценка в часах × 60'],
    ],
    sampleHeaders: ['Identifier', 'Title', 'Created at', 'Assignee', 'system', 'Estimate'],
    sample: ['ENG-1024', 'Backlog refinement', '2026-04-12T10:30:00.000Z', 'PM-Mark', 'Linear', 41],
  },
  {
    id: 'notion',
    label: 'Notion',
    abbr: 'N',
    color: '#191919',
    bg: '#f0f0f0',
    hint: 'Базы данных и документы',
    steps: [
      'Откройте базу данных в режиме таблицы (Table view)',
      'Нажмите ··· → Export → Export as CSV',
      'Убедитесь что в базе есть: Name, Assign, Created time, Estimate',
    ],
    mapping: [
      ['ID',           'case_id',   'Автоматический ID записи Notion'],
      ['Name',         'activity',  'Название записи или страницы'],
      ['Created time', 'timestamp', 'Дата создания в ISO 8601'],
      ['Assign',       'actor',     'Ответственный (поле Person)'],
      ['—',            'system',    'Подставляется автоматически: "Notion"'],
      ['Estimate',     'duration',  'Оценка трудозатрат в минутах'],
    ],
    sampleHeaders: ['ID', 'Name', 'Created time', 'Assign', 'system', 'Estimate'],
    sample: ['abc123', 'User interview резюме', '2026-04-12T14:05:00.000Z', 'PM-Lena', 'Notion', 48],
  },
  {
    id: 'confluence',
    label: 'Confluence',
    abbr: 'CF',
    color: '#0747A6',
    bg: '#e6eeff',
    hint: 'Документация и PRD',
    steps: [
      'Space Settings → Content Report → выгрузите список страниц',
      'Или используйте REST API: /rest/api/content?spaceKey=PM',
      'Включите поля: ID, Title, Created, Author, Version',
    ],
    mapping: [
      ['ID',      'case_id',   'Числовой ID страницы Confluence'],
      ['Title',   'activity',  'Название страницы или документа'],
      ['Created', 'timestamp', 'Дата создания страницы'],
      ['Author',  'actor',     'Автор документа'],
      ['—',       'system',    'Подставляется автоматически: "Confluence"'],
      ['Version', 'duration',  'Номер версии × 15 мин'],
    ],
    sampleHeaders: ['ID', 'Title', 'Created', 'Author', 'system', 'Version'],
    sample: ['557058', 'Release notes draft', '2026-04-12T15:00:00.000Z', 'PM-Anna', 'Confluence', 54],
  },
  {
    id: 'sheets',
    label: 'Google Sheets',
    abbr: 'GS',
    color: '#0F9D58',
    bg: '#e6f7ef',
    hint: 'Ручной журнал активностей',
    steps: [
      'Создайте таблицу с заголовками из колонки «Поле» ниже',
      'Заполните — одна строка = одно событие PM-команды',
      'File → Download → Comma Separated Values (.csv)',
    ],
    mapping: [
      ['case_id',   'case_id',   'Название проекта или процесса'],
      ['activity',  'activity',  'Активность: встреча, задача, документ'],
      ['timestamp', 'timestamp', 'Формат: ГГГГ-ММ-ДДThh:mm:ssZ'],
      ['actor',     'actor',     'Имя или роль участника'],
      ['system',    'system',    'Slack, Email, Jira, Meeting и т.д.'],
      ['duration',  'duration',  'Длительность активности в минутах'],
    ],
    sampleHeaders: ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'],
    sample: ['PROJ-Q1', 'Согласование roadmap', '2026-04-12T16:00:00Z', 'PM-Mark', 'Notion', 88],
  },
];

interface ImportBatch {
  id: string;
  source: string;
  fileName: string;
  count: number;
}

export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();
  const [error, setError] = useState<string | null>(null);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [hasLoadedDataset, setHasLoadedDataset] = useState(false);
  const [selectedId, setSelectedId] = useState('universal');
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);

  const platform = PLATFORMS.find(p => p.id === selectedId) ?? PLATFORMS[0];
  const stats = analyzer.basicStats;
  const systemsCount = hasLoadedDataset ? new Set(events.map(e => e.system)).size : 0;
  const previewRows = hasLoadedDataset && events.length > 0
    ? events.slice(0, 8).map(e => [e.case_id, e.activity, e.timestamp, e.actor, e.system, e.duration])
    : null;

  const handleDemoLoad = () => {
    if (isDemoLoaded) return;
    loadDemoData();
    setIsDemoLoaded(true);
    setHasLoadedDataset(true);
    setImportBatches([{ id: 'demo', source: 'Demo', fileName: 'demo-event-log.csv', count: DEMO_DATA.length }]);
    setError(null);
  };

  const handleClear = () => {
    clearData();
    setIsDemoLoaded(false);
    setHasLoadedDataset(false);
    setImportBatches([]);
    setError(null);
  };

  const parseCsvFile = (file: File, sourceLabel: string) =>
    new Promise<ProcessEvent[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const fields = results.meta.fields || [];
          const required = ['case_id', 'activity', 'timestamp', 'actor', 'duration'];
          const missing = required.filter(f => !fields.includes(f));
          if (missing.length > 0) {
            reject(new Error(`${file.name}: отсутствуют поля: ${missing.join(', ')}`));
            return;
          }
          const rows = results.data as any[];
          const durations = rows.map((r: any) => Number(r.duration)).filter(d => isFinite(d) && d > 0);
          const avgDur = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 1;
          resolve(rows.map((r: any) => ({
            case_id: r.case_id,
            activity: r.activity,
            timestamp: r.timestamp,
            actor: r.actor,
            system: r.system || sourceLabel,
            duration: Number(r.duration) || avgDur,
          })));
        },
        error: (err) => reject(new Error(`${file.name}: ${err.message}`)),
      });
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const groups = await Promise.all(files.map(f => parseCsvFile(f, platform.label)));
      const parsed = groups.flat();
      setEvents(hasLoadedDataset ? [...events, ...parsed] : parsed);
      setIsDemoLoaded(false);
      setHasLoadedDataset(true);
      setImportBatches(prev => {
        const next = files.map((f, i) => ({
          id: `${platform.id}-${f.name}-${Date.now()}-${i}`,
          source: platform.label,
          fileName: f.name,
          count: groups[i].length,
        }));
        return hasLoadedDataset ? [...prev, ...next] : next;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обработки файла');
    } finally {
      e.target.value = '';
    }
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

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 0 28px' }}>
        <h1>Данные</h1>
        <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 600, fontSize: 15, lineHeight: 1.55 }}>
          Выберите платформу, изучите маппинг колонок и загрузите CSV. Можно объединить несколько источников в один event log.
        </div>
      </div>

      {/* Platform selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {PLATFORMS.map(p => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '16px 8px',
                background: active ? p.bg : 'var(--surface)',
                border: `2px solid ${active ? p.color : 'transparent'}`,
                borderRadius: 14,
                cursor: 'pointer',
                boxShadow: active ? `0 0 0 3px ${p.color}22` : 'var(--sh-1)',
                transition: 'all .15s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: active ? p.color : p.bg,
                color: active ? '#fff' : p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: p.abbr.length > 2 ? 10 : p.abbr.length > 1 ? 12 : 16,
                letterSpacing: '-0.02em', flexShrink: 0,
                transition: 'all .15s',
              }}>
                {p.abbr}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? p.color : 'var(--ink)', lineHeight: 1.2 }}>{p.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Platform detail */}
      <div className="card" style={{ marginTop: 12, paddingBottom: 0 }}>
        <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: platform.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: platform.abbr.length > 2 ? 10 : platform.abbr.length > 1 ? 12 : 16, flexShrink: 0 }}>
            {platform.abbr}
          </div>
          <div>
            <h3>{platform.label}</h3>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>{platform.hint}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr' }}>
          {/* Steps */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid var(--line-soft)' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Как экспортировать</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {platform.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: platform.bg, color: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)' }}>{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapping */}
          <div style={{ paddingBottom: 0 }}>
            <div style={{ padding: '20px 24px 12px' }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Маппинг колонок</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>их колонка → наше поле</div>
            </div>
            <table className="t" style={{ fontSize: 13 }}>
              <thead><tr>
                <th style={{ color: platform.color }}>Колонка {platform.label}</th>
                <th>→ Поле</th>
                <th>Описание</th>
              </tr></thead>
              <tbody>
                {platform.mapping.map(([from, to, desc]) => (
                  <tr key={to}>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: from === '—' ? 'var(--ink-faint)' : platform.color, fontWeight: from === '—' ? 400 : 500 }}>{from}</td>
                    <td><span style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', padding: '2px 8px', borderRadius: 999, fontWeight: 600, fontSize: 12, fontFamily: 'var(--f-mono)' }}>{to}</span></td>
                    <td style={{ color: 'var(--ink-muted)' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sample row */}
            <div style={{ padding: '14px 24px', background: 'var(--bg)', borderTop: '1px solid var(--line-soft)' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Пример строки из {platform.label}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: 12, fontFamily: 'var(--f-mono)', borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>{platform.sampleHeaders.map(h => (
                      <th key={h} style={{ padding: '4px 10px', color: 'var(--ink-muted)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    <tr>{platform.sample.map((v, i) => (
                      <td key={i} style={{ padding: '6px 10px', color: i === 0 ? platform.color : 'var(--ink-3)', whiteSpace: 'nowrap' }}>{String(v)}</td>
                    ))}</tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload + Demo */}
      <div className="grid-2" style={{ marginTop: 16, alignItems: 'stretch' }}>
        {/* Upload */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3>Импорт CSV</h3>
            <span className="pill" style={{ background: platform.bg, color: platform.color }}>{platform.label}</span>
          </div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 12 }}>
            {hasLoadedDataset ? `Уже загружено ${events.length} событий. Следующий файл будет добавлен к датасету.` : 'Файл будет проверен по маппингу выбранной платформы.'}
          </div>

          <label style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, textAlign: 'center',
            border: `2px dashed ${platform.color}55`,
            borderRadius: 14, padding: '36px 24px',
            background: platform.bg + '55',
            cursor: 'pointer', position: 'relative',
            transition: 'background .15s',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: platform.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={platform.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Перетащите CSV сюда</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 300 }}>или кликните для выбора файла. Поддерживается несколько файлов сразу.</div>
            <input type="file" accept=".csv" multiple onChange={handleFileUpload}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          </label>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--neg-tint)', color: 'var(--neg)', borderRadius: 10, fontSize: 13.5 }}>
              {error}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Demo */}
          <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--warn-tint) 0%, #fff8ee 100%)' }}>
            <div className="eyebrow" style={{ color: 'var(--warn)' }}>Для тестирования</div>
            <h3 style={{ marginTop: 4 }}>Нет файла под рукой?</h3>
            <div style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>
              Демо-набор — реальный event log PM-команды: {DEMO_DATA.length} событий, {new Set(DEMO_DATA.map(e => e.case_id)).size} кейсов, {new Set(DEMO_DATA.map(e => e.actor)).size} участника.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={handleDemoLoad} disabled={isDemoLoaded}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>
                {isDemoLoaded ? 'Загружено' : 'Загрузить демо'}
              </button>
              {isDemoLoaded && <Link href="/analysis"><a className="btn btn-sm">К AS-IS →</a></Link>}
            </div>
          </div>

          {/* Dataset status */}
          <div className="card card-pad" style={{ flex: 1 }}>
            <h3>Датасет</h3>
            {!hasLoadedDataset ? (
              <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 8 }}>
                Загрузите CSV-файл или демо-набор, чтобы увидеть статистику датасета.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                  {[
                    ['События', new Intl.NumberFormat('ru-RU').format(events.length)],
                    ['Кейсы', stats.totalCases],
                    ['Участники', stats.totalActors],
                    ['Системы', systemsCount],
                  ].map(([k, v]) => (
                    <div key={String(k)} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {importBatches.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {importBatches.map(b => (
                      <span key={b.id} className="pill" style={{ fontSize: 11.5 }}>{b.source} · {b.fileName} · {b.count}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={handleClear}>Сбросить</button>
                  <button className="btn btn-sm" onClick={handleExport}>Скачать CSV</button>
                  <Link href="/analysis"><a className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>К AS-IS →</a></Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="sec-title">
        <h2>Превью датасета</h2>
        <span className="sec-sub">{previewRows ? `первые 8 из ${events.length} строк` : 'ожидается загрузка'}</span>
      </div>
      <div className="card" style={{ paddingBottom: 0 }}>
        {!previewRows ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/>
              </svg>
            </div>
            Загрузите файл или воспользуйтесь демо-набором
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="t" style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }}>
              <thead><tr>
                <th>case_id</th><th>activity</th><th>timestamp</th><th>actor</th><th>system</th>
                <th style={{ textAlign: 'right' }}>duration</th>
              </tr></thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} style={{ textAlign: j === 5 ? 'right' : 'left', color: j === 0 ? 'var(--accent)' : j === 5 ? 'var(--ink)' : 'var(--ink-3)' }}>{String(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
