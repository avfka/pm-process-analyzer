import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  FileBarChart2,
  DatabaseZap,
  CheckCircle2,
  ListChecks,
  MousePointerClick,
  Wrench,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Recommendation } from '@/lib/analyzer';
import {
  formatRub,
  MCKINSEY_AI_TIME_REDUCTION,
  PM_MONTHLY_SALARY,
  RECOMMENDATION_EVIDENCE_BY_ID,
  WEEKS_PER_MONTH,
  WORK_HOURS_PER_MONTH,
} from '@/lib/pm-insights';

const TYPE_CONFIG: Record<
  Recommendation['type'],
  { icon: React.ElementType; color: string; bg: string; border: string; accent: string }
> = {
  report: {
    icon: FileBarChart2,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'bg-blue-600',
  },
  data: {
    icon: DatabaseZap,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    accent: 'bg-violet-600',
  },
  approval: {
    icon: CheckCircle2,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'bg-rose-600',
  },
  backlog: {
    icon: ListChecks,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'bg-amber-500',
  },
  manual: {
    icon: MousePointerClick,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'bg-emerald-600',
  },
};

const PRIORITY_CONFIG = {
  Высокий: { badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Средний:  { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Низкий:   { badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
} as const;

const EFFORT_CONFIG = {
  'Низкие':   'bg-emerald-100 text-emerald-700',
  'Средние':  'bg-amber-100 text-amber-700',
  'Высокие':  'bg-rose-100 text-rose-700',
} as const;

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const type = TYPE_CONFIG[rec.type];
  const prio = PRIORITY_CONFIG[rec.priority];
  const Icon = type.icon;

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${type.border}`}>
      {/* Coloured left accent bar */}
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${type.accent}`} />
        <div className="flex-1">
          <CardHeader className={`pb-3 pt-4 px-5 ${type.bg}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Number + icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${type.bg} ${type.color} border ${type.border}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                    <CardTitle className={`text-base font-bold ${type.color}`}>{rec.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`border text-xs font-semibold ${prio.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${prio.dot}`} />
                      {rec.priority} приоритет
                    </Badge>
                    <Badge className={`text-xs ${EFFORT_CONFIG[rec.effortLevel]}`}>
                      Усилия: {rec.effortLevel}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className={`p-1.5 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0 ${type.color}`}
                aria-label="Показать подробности"
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-5 pt-4 pb-4 space-y-4">
            {/* Explanation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Объяснение
              </p>
              <p className="text-sm text-foreground leading-relaxed">{rec.explanation}</p>
            </div>

            {/* Effect */}
            <div className={`rounded-xl p-4 ${type.bg} border ${type.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${type.color}`} />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ожидаемый эффект
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{rec.effect}</p>
            </div>

            {/* Expandable details */}
            {expanded && (
              <div className="space-y-4 pt-1 border-t border-border/30">
                {/* Related activities */}
                {rec.relatedActivities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Связанные активности
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rec.relatedActivities.map((act) => (
                        <span
                          key={act}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium ${type.bg} ${type.color} ${type.border}`}
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics + Tool */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Показатель</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{rec.metric}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Инструмент</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{rec.tool}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Источник данных</p>
                    <p className="mt-1 text-sm font-medium text-blue-950">
                      {RECOMMENDATION_EVIDENCE_BY_ID[rec.id]?.source ?? 'Источник будет уточнён после классификации процесса'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Нормативное обоснование</p>
                    <p className="mt-1 text-sm font-medium text-violet-950">
                      {RECOMMENDATION_EVIDENCE_BY_ID[rec.id]?.pmbok ?? 'PMBoK 6 · процесс будет уточнён после классификации'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

export default function Recommendations() {
  const { events, analyzer } = useData();
  const [teamSize, setTeamSize] = useState(3);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
          <Lightbulb className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных для анализа</h2>
        <p className="text-muted-foreground max-w-sm">
          Загрузите CSV или воспользуйтесь демо-данными, чтобы получить персонализированные рекомендации.
        </p>
        <Link href="/upload"><Button>Загрузить данные</Button></Link>
      </div>
    );
  }

  const recs = analyzer.generateRecommendations();
  const highCount = recs.filter((r) => r.priority === 'Высокий').length;
  const midCount  = recs.filter((r) => r.priority === 'Средний').length;
  const lowCount  = recs.filter((r) => r.priority === 'Низкий').length;
  const totalSaving = recs.reduce((sum, r) => {
    const match = r.timeSaving.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  const totalMinutes = events.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const minuteRate = PM_MONTHLY_SALARY / (WORK_HOURS_PER_MONTH * 60);
  const weeklySavingHours = Math.round((totalMinutes * MCKINSEY_AI_TIME_REDUCTION / 60 * teamSize) * 10) / 10;
  const monthlySavingRub = totalMinutes * MCKINSEY_AI_TIME_REDUCTION * minuteRate * WEEKS_PER_MONTH * teamSize;
  const yearlySavingRub = monthlySavingRub * 12;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={26} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Рекомендации</h1>
          <p className="text-muted-foreground mt-1">
            Сформированы автоматически на основе event log и показателя автоматизируемости Ai
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {highCount > 0 && (
          <Card className="border-rose-200 bg-rose-50/60 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-rose-700">{highCount}</p>
              <p className="text-xs text-rose-600 font-medium mt-0.5">Высокий приоритет</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{midCount}</p>
            <p className="text-xs text-amber-600 font-medium mt-0.5">Средний приоритет</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/60 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-600">{lowCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Низкий приоритет</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{totalSaving}+</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Ч/нед потенциальной экономии</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Калькулятор экономии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">Размер команды PM</p>
              <Badge className="bg-emerald-600">{teamSize} PM</Badge>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[teamSize]}
              onValueChange={(value) => setTeamSize(value[0] ?? 3)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Экономия в месяц</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">~{formatRub(monthlySavingRub)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Экономия в год</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">~{formatRub(yearlySavingRub)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Часов в неделю</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">~{weeklySavingHours} ч</p>
            </div>
          </div>
          <p className="text-xs text-emerald-800">
            Расчёт на основе McKinsey (2024) и средней зарплаты PM hh.ru (2024)
          </p>
        </CardContent>
      </Card>

      {/* Recommendation cards */}
      <div className="space-y-4">
        {recs.map((rec, i) => (
          <RecommendationCard key={rec.id} rec={rec} index={i} />
        ))}
      </div>
    </div>
  );
}
