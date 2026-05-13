import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Repeat, ArrowRight, GitBranch, BarChart2, ListOrdered, Route } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const TYPICAL_PROCESS = [
  "Сбор метрик",
  "Анализ метрик",
  "Выявление проблемы",
  "Формирование гипотезы",
  "Обновление backlog",
  "Подготовка требований",
  "Оценка задач",
  "Приоритизация",
  "Согласование",
  "Финализация",
];

const BOTTLENECK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function ProcessAnalysis() {
  const { events, analyzer } = useData();
  const [transitionPage, setTransitionPage] = useState(0);
  const TRANSITIONS_PER_PAGE = 10;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных для анализа</h2>
        <p className="text-muted-foreground max-w-sm">Загрузите CSV файл или воспользуйтесь демо-данными.</p>
        <Link href="/upload"><Button>Загрузить данные</Button></Link>
      </div>
    );
  }

  const stats = analyzer.getActivityStats();
  const bottlenecks = [...stats].sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5);
  const cycles = analyzer.getCycles();
  const transitions = analyzer.getTransitions();
  const variants = analyzer.getProcessVariants();
  const mostFrequentPath = analyzer.getMostFrequentPath();
  const avgCaseLength = analyzer.getAvgCaseLength();
  const variantCount = variants.length;

  const pagedTransitions = transitions.slice(
    transitionPage * TRANSITIONS_PER_PAGE,
    (transitionPage + 1) * TRANSITIONS_PER_PAGE
  );
  const totalTransitionPages = Math.ceil(transitions.length / TRANSITIONS_PER_PAGE);

  const bottleneckChartData = bottlenecks.map((b) => ({
    name: b.activity.length > 20 ? b.activity.slice(0, 18) + '…' : b.activity,
    fullName: b.activity,
    duration: Math.round(b.avgDuration),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Анализ процессов</h1>
        <p className="text-muted-foreground mt-2">Переходы, варианты, узкие места и типовые сценарии</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={GitBranch}
          label="Вариантов процесса"
          value={variantCount}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <SummaryCard
          icon={ListOrdered}
          label="Ср. длина кейса (шаги)"
          value={avgCaseLength}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={ArrowRight}
          label="Уникальных переходов"
          value={transitions.length}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <SummaryCard
          icon={Repeat}
          label="Циклов (возвратов)"
          value={cycles.length}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Most frequent path */}
      {mostFrequentPath.length > 0 && (
        <Card className="border-border/50 shadow-md overflow-hidden">
          <CardHeader className="bg-blue-50/60 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Route className="w-5 h-5" />
              Самый частый путь процесса
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs">
                {variants[0]?.count} кейс{variants[0]?.count === 1 ? '' : variants[0]?.count < 5 ? 'а' : 'ов'} · {variants[0]?.share}% от всех
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {mostFrequentPath.map((step, i) => (
                <React.Fragment key={i}>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
                    {step}
                  </span>
                  {i < mostFrequentPath.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transition table */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/10">
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Таблица переходов между активностями
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-border/30 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left font-semibold w-[40%]">Откуда (активность)</th>
                <th className="px-5 py-3 text-left font-semibold w-[40%]">Куда (активность)</th>
                <th className="px-5 py-3 text-right font-semibold w-[20%]">Переходов</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {pagedTransitions.map((t, i) => {
                const maxCount = transitions[0]?.count || 1;
                const intensity = Math.round((t.count / maxCount) * 100);
                return (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{t.from}</td>
                    <td className="px-5 py-3 text-slate-600 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {t.to}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${intensity}%` }}
                          />
                        </div>
                        <span className="font-bold text-foreground w-6 text-right">{t.count}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalTransitionPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-slate-50/50 text-sm text-muted-foreground">
            <span>Страница {transitionPage + 1} из {totalTransitionPages} · Всего {transitions.length} переходов</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={transitionPage === 0}
                onClick={() => setTransitionPage((p) => p - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={transitionPage === totalTransitionPages - 1}
                onClick={() => setTransitionPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Process variants list */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/10">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-600" />
            Варианты процесса
            <Badge className="ml-2 bg-violet-50 text-violet-700 border-violet-200 text-xs">{variantCount} уникальных</Badge>
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/30">
          {variants.slice(0, 5).map((v, i) => (
            <div key={i} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {v.count} кейс{v.count === 1 ? '' : v.count < 5 ? 'а' : 'ов'}
                  </span>
                  <Badge className="bg-violet-50 text-violet-600 border-violet-200 text-xs">{v.share}%</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{v.path.length} шагов</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 ml-8">
                {v.path.map((step, j) => (
                  <React.Fragment key={j}>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {step}
                    </span>
                    {j < v.path.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {variants.length > 5 && (
            <div className="px-5 py-3 text-center text-sm text-muted-foreground bg-slate-50/50">
              Ещё {variants.length - 5} вариантов
            </div>
          )}
        </div>
      </Card>

      {/* Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-red-100/80 bg-red-50/40">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Clock className="w-5 h-5" />
              Узкие места — по длительности
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bottleneckChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" мин" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [`${v} мин`, 'Ср. длительность']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="duration" radius={[0, 6, 6, 0]}>
                  {bottleneckChartData.map((_, index) => (
                    <Cell key={index} fill={BOTTLENECK_COLORS[index % BOTTLENECK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 divide-y divide-border/30">
              {bottlenecks.map((item, i) => (
                <div key={item.activity} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: BOTTLENECK_COLORS[i % BOTTLENECK_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.activity}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-foreground">{Math.round(item.avgDuration)} мин</span>
                    <span className="text-xs text-muted-foreground ml-2">({item.count} раз)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cycles */}
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-amber-100/80 bg-amber-50/40">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Repeat className="w-5 h-5" />
              Обнаруженные циклы (возвраты)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cycles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Циклы не обнаружены</div>
            ) : (
              <div className="divide-y divide-border/50">
                {cycles.slice(0, 6).map((cycle, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <Badge variant="outline" className="mb-1.5 bg-slate-100 text-xs">{cycle.case_id}</Badge>
                      <p className="font-medium text-foreground text-sm">{cycle.activity}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
                      ×{cycle.count} повтора
                    </Badge>
                  </div>
                ))}
                {cycles.length > 6 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-slate-50">
                    Ещё {cycles.length - 6} циклов
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Typical PM process */}
      <Card className="border-border/50 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/10 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Типовой процесс продакт-менеджера
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Эталонная схема жизненного цикла фичи — от сбора метрик до финализации
          </p>
        </CardHeader>
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            {TYPICAL_PROCESS.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="px-3 py-2 rounded-xl bg-primary/8 border border-primary/20 text-sm font-medium text-primary text-center max-w-[120px] leading-tight">
                    {step}
                  </span>
                </div>
                {i < TYPICAL_PROCESS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-primary/40 flex-shrink-0 mb-5" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-border/30 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Назначение схемы:</span>{' '}
            сравните эталонный путь с реальными вариантами процесса выше, чтобы выявить отклонения и точки автоматизации.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
