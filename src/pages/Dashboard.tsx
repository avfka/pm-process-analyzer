import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, Coins, Upload, Zap } from "lucide-react";
import {
  formatRub,
  getDashboardMetrics,
  getWorkloadSlices,
} from "@/lib/pm-insights";

const COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const RESEARCH_PAIN_CARDS = [
  {
    value: "58% рабочего дня",
    title: "уходит на «work about work»",
    source: "Asana Anatomy of Work, 2023 · 9 615 респондентов",
  },
  {
    value: "116 минут за сеанс",
    title: "тратит PM на контентно-тяжёлые задачи без AI",
    source: "McKinsey, 2024 · 40 PM из 4 стран",
  },
  {
    value: "−40% времени",
    title: "при автоматизации контентно-тяжёлых задач",
    source: "McKinsey Generative AI & PM Study, 2024",
  },
];

function EmptyState() {
  return (
    <div className="space-y-6">
      <div className="border border-border/50 bg-white p-8">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            PM Operations Intelligence
          </Badge>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Найдите, куда уходит время продакт-менеджера
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Приложение переводит event log PM-команды в структуру операционной нагрузки,
            рейтинг автоматизации Ai, экономический эффект, шаблоны повторяющихся материалов
            и TO-BE модель процессов.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload">
              <Button size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Загрузить данные
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline">
                Использовать демо
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Нагрузка", "58% work about work становится видимой по категориям задач."],
          ["Шаблоны", "Повторяющиеся отчеты и повестки собираются из данных."],
          ["Ai", "Каждый процесс получает приоритет автоматизации."],
          ["Эффект", "Потенциал переводится в часы и рубли."],
          ["TO-BE", "Целевое состояние описывается через PMBoK 6."],
        ].map(([title, text]) => (
          <Card key={title} className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { events, analyzer } = useData();

  if (events.length === 0) return <EmptyState />;

  const slices = getWorkloadSlices(events);
  const dashboardMetrics = getDashboardMetrics(events);
  const topScores = analyzer.getAutomationScores().slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Операционная нагрузка PM</h1>
          <p className="mt-2 text-muted-foreground">
            Структура времени, work about work и процессы, которые первыми нужно автоматизировать.
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          {events.length} событий загружено
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Clock}
          label="Суммарные трудозатраты"
          value={`${dashboardMetrics.totalMinutes} мин · ${dashboardMetrics.totalHours} ч`}
          detail="сумма duration по всем событиям"
        />
        <MetricCard
          icon={Coins}
          label="Потенциальная экономия"
          value={`~${formatRub(dashboardMetrics.monthlySavingRub)}/мес`}
          detail="По данным McKinsey (2024), AI сокращает контентно-тяжёлые задачи на 40%"
        />
        <MetricCard
          icon={Zap}
          label="Часов в неделю на рутину"
          value={`${dashboardMetrics.routineHoursPerWeek} ч/нед`}
          detail="на основе McKinsey 2024"
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Боли из исследований</h2>
          <p className="text-sm text-muted-foreground">
            Данные, которые объясняют, зачем нужен анализ и автоматизация PM-рутины.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {RESEARCH_PAIN_CARDS.map((card) => (
            <Card key={card.value} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <p className="text-2xl font-bold text-primary">{card.value}</p>
                <p className="mt-2 font-medium text-foreground">{card.title}</p>
                <p className="mt-3 text-xs text-muted-foreground">{card.source}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Распределение трудозатрат</CardTitle>
            <CardDescription>Категории задач PM по суммарной длительности</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slices} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" ч" />
                <YAxis dataKey="category" type="category" width={155} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value} ч`, "Трудозатраты"]} />
                <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                  {slices.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Доля операционной работы</CardTitle>
            <CardDescription>Что раньше было невидимым work about work</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="minutes"
                  nameKey="category"
                  innerRadius={62}
                  outerRadius={104}
                  paddingAngle={2}
                >
                  {slices.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${Math.round(value / 60)} ч`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Топ операционной нагрузки</CardTitle>
            <CardDescription>Категории, где PM теряет больше всего времени</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {slices.map((slice, index) => (
              <div key={slice.category} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <p className="font-semibold text-foreground">{slice.category}</p>
                      <p className="text-xs text-muted-foreground">{slice.topActivities.join(", ") || "нет активностей"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{slice.hours} ч</p>
                    <p className="text-xs text-muted-foreground">{slice.share}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Что автоматизировать первым</CardTitle>
            <CardDescription>Топ-3 процесса по показателю Ai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topScores.map((score, index) => (
              <div key={score.activity} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <p className="font-semibold text-foreground">{score.activity}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{score.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{score.score}</p>
                    <p className="text-xs text-muted-foreground">Ai</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/rating"><Button variant="outline">Открыть Ai рейтинг</Button></Link>
              <Link href="/recommendations"><Button>Посчитать эффект</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
