import React from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell,
} from 'recharts';
import {
  Layers, Activity, Users, Clock, ListOrdered,
  Upload, ScanSearch, BarChart2, Zap, Lightbulb, ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

const PALETTE = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Upload,
    title: 'Загрузка Event Log',
    desc: 'Загрузите CSV файл с событиями процесса или используйте демо-данные. Поддерживаются поля: case_id, activity, timestamp, actor, system, duration.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    step: 2,
    icon: ScanSearch,
    title: 'Анализ процессов',
    desc: 'Система выявляет последовательности шагов, варианты процесса, узкие места, циклы и строит матрицу переходов между активностями.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
  },
  {
    step: 3,
    icon: BarChart2,
    title: 'Расчёт метрик',
    desc: 'Рассчитываются частота, средняя длительность, число вариантов, средняя длина кейса и распределение по участникам и системам.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    step: 4,
    icon: Zap,
    title: 'Расчёт показателя Ai',
    desc: 'Для каждой активности вычисляется индекс автоматизируемости: Ai = 0.35·Частота + 0.25·Длительность + 0.20·Вариативность + 0.20·Структура.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    step: 5,
    icon: Lightbulb,
    title: 'Формирование рекомендаций',
    desc: 'На основе Ai и паттернов процесса система формирует приоритизированные рекомендации по автоматизации с ожидаемым эффектом.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
  },
];

function HowItWorks() {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/30 bg-slate-50/70 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanSearch className="w-5 h-5 text-primary" />
          Как работает система
        </CardTitle>
        <CardDescription>
          Пять шагов от сырых данных до готовых рекомендаций по автоматизации
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-5 px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Step number + icon */}
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} border ${item.border}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                    <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${item.badge}`}>
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${item.color} mb-1`}>{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[150px] mx-auto">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:flex items-start justify-center pt-7 text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { events, analyzer } = useData();
  const stats = analyzer.basicStats;
  const activityStats = analyzer.getActivityStats().slice(0, 5);
  const avgCaseLength = analyzer.getAvgCaseLength();
  const systemData = getSystemData(events);
  const topScores = analyzer.getAutomationScores().slice(0, 3);

  if (events.length === 0) {
    return (
      <div className="space-y-8">
        {/* Hero empty state */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Activity size={40} className="text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-display font-bold text-foreground">PM Process Analyzer</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Загрузите Event Log в формате CSV и получите полный анализ процессов с рейтингом
              автоматизируемости и готовыми рекомендациями.
            </p>
            <div className="flex gap-3 mt-5 justify-center md:justify-start">
              <Link href="/upload">
                <Button size="lg" className="shadow-md shadow-primary/20">
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить данные
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="lg" variant="outline">
                  Демо-данные
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-2 text-sm text-muted-foreground">
            {['Анализ переходов', 'Варианты процессов', 'Узкие места', 'Показатель Ai', 'Рекомендации'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <HowItWorks />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Дашборд</h1>
          <p className="text-muted-foreground mt-1">Обзор ключевых показателей операционной деятельности</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm px-3 py-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block animate-pulse" />
          Данные загружены
        </Badge>
      </div>

      {/* KPI cards — 5 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Всего событий"
          value={stats.totalEvents}
          icon={Activity}
          color="text-blue-600"
          bg="bg-blue-50"
          border="border-blue-200"
          sub="строк в event log"
        />
        <KpiCard
          label="Всего процессов"
          value={stats.totalCases}
          icon={Layers}
          color="text-violet-600"
          bg="bg-violet-50"
          border="border-violet-200"
          sub="уникальных кейсов"
        />
        <KpiCard
          label="Уникальных активностей"
          value={stats.totalActivities}
          icon={BarChart2}
          color="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-200"
          sub="видов шагов"
        />
        <KpiCard
          label="Участников"
          value={stats.totalActors}
          icon={Users}
          color="text-emerald-600"
          bg="bg-emerald-50"
          border="border-emerald-200"
          sub="уникальных акторов"
        />
        <KpiCard
          label="Ср. длина процесса"
          value={avgCaseLength}
          icon={ListOrdered}
          color="text-rose-600"
          bg="bg-rose-50"
          border="border-rose-200"
          sub="шагов на кейс"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top activities bar chart */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Топ-5 частых активностей</CardTitle>
            <CardDescription>По количеству вхождений в event log</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="activity"
                  type="category"
                  width={145}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 20 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                  formatter={(v: number) => [v, 'Событий']}
                />
                <Bar dataKey="count" radius={[0, 5, 5, 0]}>
                  {activityStats.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System distribution donut */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Распределение по системам</CardTitle>
            <CardDescription>Доля событий в каждой рабочей системе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={systemData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {systemData.map((_, i) => (
                        <PieCell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                      formatter={(v: number) => [v, 'Событий']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {systemData.map((entry, i) => {
                  const total = systemData.reduce((s, d) => s + d.value, 0);
                  const pct = Math.round((entry.value / total) * 100);
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                      />
                      <span className="text-foreground font-medium">{entry.name}</span>
                      <span className="text-muted-foreground ml-auto pl-3">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top automation candidates */}
      {topScores.length > 0 && (
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Топ кандидаты на автоматизацию
              </CardTitle>
              <CardDescription>Активности с наибольшим показателем Ai</CardDescription>
            </div>
            <Link href="/rating">
              <Button variant="outline" size="sm" className="text-xs">
                Весь рейтинг <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {topScores.map((s, i) => {
                const priorityCfg = {
                  Высокий: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  Средний: 'bg-amber-100 text-amber-700 border-amber-200',
                  Низкий: 'bg-slate-100 text-slate-600 border-slate-200',
                }[s.priority];
                const barColor = s.score >= 75 ? 'bg-emerald-500' : s.score >= 50 ? 'bg-amber-500' : 'bg-slate-400';
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/70 border border-border/30 hover:bg-slate-50 transition-colors">
                    <span className="text-lg font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground flex-1">{s.activity}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${s.score}%` }} />
                        </div>
                        <span className="text-sm font-bold text-foreground w-6">{s.score}</span>
                      </div>
                      <Badge className={`text-xs border ${priorityCfg}`}>{s.priority}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <HowItWorks />
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, color, bg, border, sub,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; bg: string; border: string; sub: string;
}) {
  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${border}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground leading-tight pr-1">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon size={16} className={color} />
          </div>
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function getSystemData(events: any[]) {
  const counts: Record<string, number> = {};
  events.forEach((e) => { counts[e.system] = (counts[e.system] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}
