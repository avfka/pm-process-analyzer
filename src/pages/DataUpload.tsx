import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2, Database } from 'lucide-react';
import Papa from 'papaparse';
import { ProcessEvent } from '@/lib/demo-data';

export default function DataUpload() {
  const { events, setEvents, loadDemoData, clearData, analyzer } = useData();
  const [error, setError] = useState<string | null>(null);
  const stats = analyzer.basicStats;

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
        <h1 className="text-2xl font-display font-bold text-foreground sm:text-3xl">Загрузка данных</h1>
        <p className="text-muted-foreground mt-2">Загрузите Event Log в формате CSV для анализа процессов</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Импорт CSV файла</CardTitle>
            <CardDescription>
              Файл должен содержать столбцы: case_id, activity, timestamp, actor, system, duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-5 sm:p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
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
          <CardContent className="flex flex-col justify-center sm:h-48">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Демо-данные содержат смоделированный процесс работы продакт-менеджера: сбор требований, работу в Jira, встречи и согласования.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button onClick={loadDemoData} className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                  <Database className="w-4 h-4 mr-2" />
                  Загрузить демо-данные
                </Button>
                {events.length > 0 && (
                  <Button variant="destructive" onClick={clearData} size="icon" className="w-full sm:w-9">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Загружено {events.length} событий · {stats.totalCases} кейсов · {stats.totalActors} участника
        </div>
      )}
    </div>
  );
}
