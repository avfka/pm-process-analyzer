import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, Route, TrendingUp, Zap } from 'lucide-react';
import { formatRub, getAutomationDetail } from '@/lib/pm-insights';

const PRIORITY_CONFIG = {
  Высокий: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  Средний: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  Низкий: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
  },
} as const;

function AiScale({ score, priority }: { score: number; priority: 'Высокий' | 'Средний' | 'Низкий' }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <span className="text-base font-bold text-foreground w-8 text-right">{score}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const FACTOR_COLORS = {
  freqScore: '#3b82f6',
  durScore: '#8b5cf6',
  varScore: '#10b981',
  structScore: '#f59e0b',
};

export default function AutomationRating() {
  const { events, analyzer } = useData();
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных</h2>
        <p className="text-muted-foreground max-w-sm">Загрузите данные, чтобы рассчитать показатель автоматизируемости.</p>
        <Link href="/upload"><Button>Загрузить данные</Button></Link>
      </div>
    );
  }

  const scores = analyzer.getAutomationScores();
  const highCount = scores.filter((s) => s.priority === 'Высокий').length;
  const midCount = scores.filter((s) => s.priority === 'Средний').length;
  const selectedScore = scores.find((score) => score.activity === selectedActivity) ?? scores[0];
  const selectedDetail = selectedScore ? getAutomationDetail(selectedScore, events) : null;

  const chartData = scores.slice(0, 10).map((s) => ({
    name: s.activity.length > 18 ? s.activity.slice(0, 16) + '…' : s.activity,
    fullName: s.activity,
    'Частота (×0.35)': Math.round(s.freqScore * 0.35),
    'Длительность (×0.25)': Math.round(s.durScore * 0.25),
    'Вариативность (×0.20)': Math.round(s.varScore * 0.20),
    'Структура (×0.20)': Math.round(s.structScore * 0.20),
    total: s.score,
    priority: s.priority,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Рейтинг автоматизации</h1>
        <p className="text-muted-foreground mt-2">
          Показатель Ai рассчитывается по формуле: 0.35 · Частота + 0.25 · Длительность + 0.20 · Вариативность + 0.20 · Структура
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Высокий приоритет (Ai ≥ 75)</p>
              <p className="text-2xl font-bold text-emerald-800">{highCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-medium">Средний приоритет (50–74)</p>
              <p className="text-2xl font-bold text-amber-800">{midCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked bar chart */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle>Топ‑10: структура показателя Ai</CardTitle>
          <CardDescription>Вклад каждого фактора в итоговый балл (взвешенные значения)</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                formatter={(value: number, name: string) => [`${value} балл.`, name]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              <Bar dataKey="Частота (×0.35)" stackId="a" fill={FACTOR_COLORS.freqScore} />
              <Bar dataKey="Длительность (×0.25)" stackId="a" fill={FACTOR_COLORS.durScore} />
              <Bar dataKey="Вариативность (×0.20)" stackId="a" fill={FACTOR_COLORS.varScore} />
              <Bar dataKey="Структура (×0.20)" stackId="a" fill={FACTOR_COLORS.structScore} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Detailed table */}
        <Card className="shadow-md border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border/10">
            <CardTitle>Детальный рейтинг автоматизации</CardTitle>
            <CardDescription>Нажмите на строку, чтобы увидеть TO-BE модель и экономику</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-muted-foreground text-xs border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold w-6">#</th>
                  <th className="px-4 py-3 font-semibold">Процесс</th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    <span className="text-blue-600">●</span> Частота
                    <br /><span className="font-normal text-muted-foreground/70 text-[10px]">вес 0.35</span>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                    <span className="text-violet-600">●</span> Ср. длит.
                    <br /><span className="font-normal text-muted-foreground/70 text-[10px]">мин · вес 0.25</span>
                  </th>
                  <th className="px-4 py-3 font-semibold text-left whitespace-nowrap min-w-[180px]">
                    Ai
                  </th>
                  <th className="px-4 py-3 font-semibold">Приоритет</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-white">
                {scores.map((score, i) => {
                  const cfg = PRIORITY_CONFIG[score.priority];
                  const isSelected = selectedScore?.activity === score.activity;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedActivity(score.activity)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-foreground max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          {score.activity}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-foreground font-medium">{score.frequency}</div>
                        <div className="text-[11px] text-blue-500 font-semibold">({score.freqScore})</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-foreground font-medium">{score.avgDuration} мин</div>
                        <div className="text-[11px] text-violet-500 font-semibold">({score.durScore})</div>
                      </td>
                      <td className="px-4 py-3">
                        <AiScale score={score.score} priority={score.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${cfg.badge} border text-xs font-semibold`}>
                          {score.priority}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {selectedScore && selectedDetail && (
          <Card className="shadow-md border-primary/20 overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <Badge variant="outline" className="w-fit bg-white">Выбранный процесс</Badge>
              <CardTitle className="text-lg">{selectedScore.activity}</CardTitle>
              <CardDescription>Ai = {selectedScore.score} · {selectedScore.priority} приоритет</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-4 h-4 text-blue-700" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">TO-BE описание</p>
                </div>
                <p className="text-sm leading-relaxed text-blue-950">{selectedDetail.toBe}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Экономия</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-emerald-700">AS-IS</p>
                    <p className="font-bold text-emerald-950">{selectedDetail.asIsWeekly} мин/нед</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">TO-BE</p>
                    <p className="font-bold text-emerald-950">{selectedDetail.toBeWeekly} мин/нед</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Снижение</p>
                    <p className="font-bold text-emerald-950">−{selectedDetail.savingPercent}%</p>
                  </div>
                  <div>
                    <p className="text-emerald-700">В деньгах</p>
                    <p className="font-bold text-emerald-950">~{formatRub(selectedDetail.monthlyRub)}/мес</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-violet-700" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">PMBoK</p>
                </div>
                <p className="text-sm font-semibold text-violet-950">{selectedDetail.pmbok}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
