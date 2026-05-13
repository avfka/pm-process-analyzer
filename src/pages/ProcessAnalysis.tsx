import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Repeat, ArrowRight, BarChart2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BOTTLENECK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function ProcessAnalysis() {
  const { events, analyzer } = useData();

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

  const bottleneckChartData = bottlenecks.map((b) => ({
    name: b.activity.length > 20 ? b.activity.slice(0, 18) + '…' : b.activity,
    fullName: b.activity,
    duration: Math.round(b.avgDuration),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">AS-IS анализ процессов</h1>
        <p className="text-muted-foreground mt-2">Как процессы выглядят сейчас: переходы, варианты, возвраты и узкие места</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {transitions.map((t, i) => {
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
