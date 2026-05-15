import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Link } from 'wouter';
import Papa from 'papaparse';
import { ProcessEvent } from '@/lib/demo-data';

const SCHEMA = [
  ['case_id',   'string',   'идентификатор кейса',          'CASE-1024'],
  ['activity',  'string',   'название активности',          'Подготовка статус-отчёта'],
  ['timestamp', 'datetime', 'ISO 8601 · UTC',               '2026-04-12T09:15:00Z'],
  ['actor',     'string',   'роль/имя исполнителя',         'PM-Anna'],
  ['system',    'string',   'источник события',             'Jira'],
  ['duration',  'integer',  'длительность в минутах',       '38'],
];

const PREVIEW_ROWS = [
  ['CASE-1024','Подготовка статус-отчёта','2026-04-12T09:15:00Z','PM-Anna','Jira',38],
  ['CASE-1024','Stakeholder sync',         '2026-04-12T10:00:00Z','PM-Anna','Calendar',45],
  ['CASE-1025','Backlog refinement',       '2026-04-12T10:30:00Z','PM-Mark','Jira',41],
  ['CASE-1025','Estimation',               '2026-04-12T11:15:00Z','PM-Mark','Jira',22],
  ['CASE-1026','User interview',           '2026-04-12T13:00:00Z','PM-Lena','Notion',60],
  ['CASE-1026','User interview резюме',    '2026-04-12T14:05:00Z','PM-Lena','Notion',48],
  ['CASE-1027','Release notes draft',      '2026-04-12T15:00:00Z','PM-Anna','GitHub',54],
  ['CASE-1028','Согласование roadmap',     '2026-04-12T16:00:00Z','PM-Mark','Notion',88],
];

type DatasetKind = 'none' | 'demo' | 'csv';

export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();
  const [error, setError] = useState<string | null>(null);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [datasetKind, setDatasetKind] = useState<DatasetKind>(events.length > 0 ? 'csv' : 'none');
  const stats = analyzer.basicStats;
  const datasetLabel = events.length === 0
    ? 'Данные не загружены'
    : datasetKind === 'demo'
      ? 'Демо-набор данных'
      : 'Пользовательский CSV';

  const handleDemoLoad = () => {
    loadDemoData();
    setIsDemoLoaded(true);
    setDatasetKind('demo');
    setError(null);
  };

  const handleClearData = () => {
    clearData();
    setIsDemoLoaded(false);
    setDatasetKind('none');
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || [];
        const requiredFields = ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'];
        const missing = requiredFields.filter(f => !fields.includes(f));
        if (missing.length > 0) {
          setError(`Отсутствуют обязательные поля: ${missing.join(', ')}`);
          return;
        }
        const parsedEvents: ProcessEvent[] = (results.data as any[]).map((row: any) => ({
          case_id: row.case_id,
          activity: row.activity,
          timestamp: row.timestamp,
          actor: row.actor,
          system: row.system,
          duration: Number(row.duration) || 0,
        }));
        setEvents(parsedEvents);
        setIsDemoLoaded(false);
        setDatasetKind('csv');
        setError(null);
      },
      error: (err) => setError(`Ошибка парсинга CSV: ${err.message}`),
    });
  };

  return (
    <div>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '16px 0 28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Данные</h1>
          <div style={{ marginTop: 10, color: 'var(--ink-muted)', maxWidth: 720, fontSize: 15, lineHeight: 1.55 }}>
            Загрузите CSV-файл с event log. Приложение проверит структуру файла и построит аналитику по процессам PM-команды.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {events.length > 0
            ? <span className="pill pill-pos">
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                Схема ок
              </span>
            : null}
        </div>
      </div>

      <div className="grid-asym">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload */}
          <div className="card card-pad">
            <h3>Импорт CSV</h3>
            <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>
              Файл должен содержать обязательные поля: <strong style={{ color: 'var(--ink-3)' }}>case_id, activity, timestamp, actor, system, duration</strong>.
            </div>
            <div style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 6 }}>
              После загрузки приложение проверит наличие этих полей и покажет статус в требованиях к CSV.
            </div>

            <div style={{ marginTop: 20, border: '2px dashed var(--line-strong)', borderRadius: 16, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', background: 'var(--surface-2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M12 3v13M6 9l6-6 6 6"/>
                </svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6 }}>Выберите CSV-файл</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13.5, maxWidth: 360 }}>Парсер проверит структуру файла и загрузит события для анализа.</div>
              <label style={{ position: 'relative', cursor: 'pointer', marginTop: 12 }}>
                <span className="btn">Выбрать файл</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </label>
            </div>

            {error && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--neg-tint)', color: 'var(--neg)', borderRadius: 10, fontSize: 13.5 }}>{error}</div>}

            {events.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <span className="pill pill-pos">
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                  Заголовки
                </span>
                <span className="pill pill-pos">{events.length} строки</span>
                <span className="pill pill-pos">0 пропусков</span>
                <span className="pill">UTF-8</span>
              </div>
            )}
          </div>

          <div className="card card-pad" style={{ background: 'var(--warn-tint)' }}>
            <div className="eyebrow" style={{ color: 'var(--warn)' }}>Для тестирования</div>
            <h3 style={{ marginTop: 4 }}>Нет файла под рукой?</h3>
            <div style={{ color: 'var(--ink-3)', fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>
              Загрузите демо-набор данных, чтобы посмотреть все разделы приложения на примере event log PM-команды.
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleDemoLoad} style={{ marginTop: 16 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>
              Загрузить демо-набор
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="card card-pad">
          <h3>Текущий датасет</h3>
          <div style={{ color: events.length > 0 ? 'var(--accent)' : 'var(--ink-muted)', fontSize: 13, marginTop: 4, fontWeight: 600 }}>{datasetLabel}</div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row k="События"   v={events.length > 0 ? new Intl.NumberFormat('ru-RU').format(events.length) : '—'} />
            <Row k="Кейсы"     v={events.length > 0 ? stats.totalCases : '—'} />
            <Row k="Участники" v={events.length > 0 ? stats.totalActors : '—'} />
            <Row k="Синхронизация" v={events.length > 0 ? 'только что' : '—'} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {events.length > 0 && <button className="btn btn-sm" onClick={handleClearData}>Сбросить</button>}
            {isDemoLoaded && <Link href="/analysis"><a className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>К AS-IS →</a></Link>}
          </div>
        </div>
      </div>

      {/* Schema */}
      <div className="sec-title">
        <h2>Требования к CSV-файлу</h2>
        <span className="sec-sub">эти поля проверяются при загрузке</span>
      </div>
      <div className="card table-wrap" style={{ paddingBottom: 0 }}>
        <table className="t">
          <thead><tr>
            <th>Поле</th>
            <th>Тип</th>
            <th>Описание</th>
            <th>Пример</th>
            <th style={{ textAlign: 'right' }}>Статус</th>
          </tr></thead>
          <tbody>
            {SCHEMA.map(([f, t, d, ex]) => (
              <tr key={f}>
                <td><span style={{ background: 'var(--accent-soft)', color: 'var(--accent-2)', padding: '3px 10px', borderRadius: 999, fontWeight: 600, fontSize: 13 }}>{f}</span></td>
                <td className="muted">{t}</td>
                <td>{d}</td>
                <td className="muted" style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5 }}>{ex}</td>
                <td style={{ textAlign: 'right' }}>
                  {events.length > 0 ? (
                    <span className="pill pill-pos">
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDemoLoaded && (
        <>
          {/* Preview */}
          <div className="sec-title">
            <h2>Превью</h2>
            <span className="sec-sub">первые 8 строк демо-датасета</span>
          </div>
          <div className="card table-wrap" style={{ paddingBottom: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="t" style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }}>
                <thead><tr>
                  <th>case_id</th><th>activity</th><th>timestamp</th><th>actor</th><th>system</th><th style={{ textAlign: 'right' }}>duration</th>
                </tr></thead>
                <tbody>
                  {PREVIEW_ROWS.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j} style={{ textAlign: j === 5 ? 'right' : 'left', color: j === 0 ? 'var(--accent)' : j === 5 ? 'var(--ink)' : 'var(--ink-3)' }}>{String(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
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
