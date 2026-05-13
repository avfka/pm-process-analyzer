import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, Coins, TrendingUp, Upload } from "lucide-react";
import { calculateImpact, estimateWeeklyRecoverableHours } from "@/lib/pm-insights";

function rub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ImpactCalculator() {
  const { events } = useData();
  const [teamSize, setTeamSize] = useState(4);
  const [monthlySalary, setMonthlySalary] = useState(250000);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(168);
  const [contentHeavyShare, setContentHeavyShare] = useState(55);

  const result = useMemo(
    () =>
      calculateImpact(events, {
        teamSize,
        monthlySalary,
        workHoursPerMonth,
        contentHeavyShare,
      }),
    [events, teamSize, monthlySalary, workHoursPerMonth, contentHeavyShare]
  );

  if (events.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных для расчёта</h2>
        <p className="max-w-sm text-muted-foreground">
          Загрузите event log или демо-данные, чтобы посчитать экономический эффект автоматизации.
        </p>
        <Link href="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Загрузить данные
          </Button>
        </Link>
      </div>
    );
  }

  const baseline = estimateWeeklyRecoverableHours(events);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Экономический эффект</h1>
        <p className="mt-2 text-muted-foreground">
          Переводим потенциал автоматизации в часы и рубли для обоснования инвестиций.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Параметры расчёта</CardTitle>
            <CardDescription>Можно менять под команду и зарплатную вилку</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <NumberField label="Размер команды PM" value={teamSize} onChange={setTeamSize} suffix="чел." />
            <NumberField label="Средняя зарплата PM в месяц" value={monthlySalary} onChange={setMonthlySalary} suffix="₽" step={10000} />
            <NumberField label="Рабочих часов в месяц" value={workHoursPerMonth} onChange={setWorkHoursPerMonth} suffix="ч" />
            <NumberField label="Доля content-heavy задач" value={contentHeavyShare} onChange={setContentHeavyShare} suffix="%" />

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Методика</p>
              <p className="mt-1">
                Content-heavy задачи считаются с эффектом −40%, content-light — −15%.
                Базовый потенциал из текущих данных: {baseline} ч/нед на одного PM.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard icon={TrendingUp} label="Экономия в месяц" value={`${result.monthlyHours} ч`} detail={`${result.weeklyHours} ч/нед на команду`} />
            <ResultCard icon={Coins} label="Экономия в деньгах" value={rub(result.monthlyRub)} detail={`${rub(result.yearlyRub)} в год`} />
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Расклад эффекта</CardTitle>
              <CardDescription>Как McKinsey-оценки применяются к вашей команде</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Breakdown label="Content-heavy база" value={`${result.heavyHours} ч/нед`} detail="отчёты, PRD, сводки" />
                <Breakdown label="Content-light база" value={`${result.lightHours} ч/нед`} detail="статусы, переносы, сверки" />
                <Breakdown label="Ставка часа" value={rub(result.hourlyRate)} detail="на одного PM" />
              </div>
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600">Итог</Badge>
                  <p className="font-semibold text-emerald-950">
                    Автоматизация может вернуть {result.yearlyHours} часов в год и обосновать эффект {rub(result.yearlyRub)}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
        />
        <span className="w-12 text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Calculator;
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

function Breakdown({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
