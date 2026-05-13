import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Trash2, Database } from 'lucide-react';
import Papa from 'papaparse';
import { ProcessEvent } from '@/lib/demo-data';

export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData } = useData();
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate headers
        const fields = results.meta.fields || [];
        const requiredFields = ['case_id', 'activity', 'timestamp', 'actor', 'system', 'duration'];
        const missing = requiredFields.filter(f => !fields.includes(f));
        
        if (missing.length > 0) {
          setError(`Отсутствуют обязательные поля: ${missing.join(', ')}`);
          return;
        }

        const parsedEvents: ProcessEvent[] = results.data.map((row: any) => ({
          case_id: row.case_id,
          activity: row.activity,
          timestamp: row.timestamp,
          actor: row.actor,
          system: row.system,
          duration: Number(row.duration) || 0,
        }));

        setEvents(parsedEvents);
        setError(null);
      },
      error: (err) => {
        setError(`Ошибка парсинга CSV: ${err.message}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Загрузка данных</h1>
        <p className="text-muted-foreground mt-2">Загрузите Event Log в формате CSV для анализа процессов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Импорт CSV файла</CardTitle>
            <CardDescription>
              Файл должен содержать столбцы: case_id, activity, timestamp, actor, system, duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-foreground font-medium mb-1">Перетащите файл сюда или нажмите для выбора</p>
              <p className="text-xs text-muted-foreground mb-6">Только CSV файлы (макс. 5MB)</p>
              <label className="relative">
                <Button variant="outline" className="pointer-events-none">
                  Выбрать файл
                </Button>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </label>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle>Быстрый старт</CardTitle>
            <CardDescription>
              Нет своих данных? Используйте наш подготовленный датасет.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-48">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Демо-данные содержат смоделированный процесс работы продакт-менеджера: сбор требований, работу в Jira, встречи и согласования.
              </p>
              <div className="flex gap-4">
                <Button onClick={loadDemoData} className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                  <Database className="w-4 h-4 mr-2" />
                  Загрузить демо-данные
                </Button>
                {events.length > 0 && (
                  <Button variant="destructive" onClick={clearData} size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card className="border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/80 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Предпросмотр данных ({events.length} строк)
              </CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Case ID</th>
                  <th className="px-6 py-4 font-semibold">Activity</th>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Actor</th>
                  <th className="px-6 py-4 font-semibold">System</th>
                  <th className="px-6 py-4 font-semibold">Duration (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-white">
                {events.slice(0, 10).map((event, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{event.case_id}</td>
                    <td className="px-6 py-3 text-slate-700">{event.activity}</td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(event.timestamp).toLocaleString('ru-RU')}</td>
                    <td className="px-6 py-3 text-slate-700">{event.actor}</td>
                    <td className="px-6 py-3 text-slate-700">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {event.system}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{event.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {events.length > 10 && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-slate-50 border-t border-border/50">
              Показаны первые 10 строк
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
