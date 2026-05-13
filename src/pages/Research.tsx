import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, LibraryBig } from "lucide-react";

const SOURCES = [
  ["McKinsey & Company, 2024", "40 PM, 4 страны", "−40% контентно-тяжёлые задачи"],
  ["Asana Anatomy of Work, 2023", "9 615 респондентов", "58% времени — work about work"],
  ["McKinsey Global Institute, 2023", "63 бизнес-кейса, 16 отраслей", "$4.4 трлн потенциал AI"],
];

const PMBOK_MAPPING = [
  ["Подготовка отчётов", "Project Communications Management", "10.2 Manage Communications", "p. 379"],
  ["Согласования", "Project Stakeholder Management", "13.3 Manage Stakeholder Engagement", "p. 523"],
  ["Backlog и требования", "Project Scope Management", "5.2 Collect Requirements", "p. 138"],
  ["Ручная коммуникация", "Project Communications Management", "10.1 Plan Communications", "p. 366"],
  ["Сбор данных и мониторинг", "Project Integration Management", "4.5 Monitor and Control Project Work", "p. 105"],
];

const FORMULA_PARTS = [
  ["F", "Частота", "0.35", "чем чаще процесс, тем выше эффект автоматизации"],
  ["D", "Длительность", "0.25", "чем дольше ручное выполнение, тем выше ROI"],
  ["V", "Вариативность", "0.20", "ниже вариативность — проще автоматизировать"],
  ["S", "Структура", "0.20", "системные данные автоматизируются лучше встреч и email"],
];

export default function Research() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Документация</h1>
        <p className="mt-2 text-muted-foreground">
          Источники, методология Aᵢ и нормативное обоснование через PMBoK 6.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LibraryBig className="h-5 w-5 text-primary" />
            Источники
          </CardTitle>
          <CardDescription>Исследования, на которых основаны коэффициенты и проблематика приложения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-slate-50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Источник</th>
                  <th className="px-4 py-3 font-semibold">Выборка</th>
                  <th className="px-4 py-3 font-semibold">Ключевой вывод</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {SOURCES.map(([source, sample, insight]) => (
                  <tr key={source}>
                    <td className="px-4 py-3 font-semibold text-foreground">{source}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sample}</td>
                    <td className="px-4 py-3 text-foreground">{insight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Методология показателя Aᵢ
          </CardTitle>
          <CardDescription>Aᵢ показывает, какие процессы выгоднее автоматизировать первыми</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-center font-mono text-lg font-bold text-foreground">
              Aᵢ = 0.35F + 0.25D + 0.20V + 0.20S
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {FORMULA_PARTS.map(([letter, name, weight, text]) => (
              <div key={letter} className="rounded-lg border border-border/50 p-4">
                <Badge variant="outline">{letter} · вес {weight}</Badge>
                <p className="mt-3 font-semibold text-foreground">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-foreground">Пример расчёта</p>
            <p className="mt-1 text-muted-foreground">
              Если процесс имеет F=80, D=60, V=70, S=90, то Aᵢ = 0.35×80 + 0.25×60 + 0.20×70 + 0.20×90 = 75.
              Такой процесс попадает в высокий приоритет автоматизации.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Маппинг на PMBoK 6
          </CardTitle>
          <CardDescription>Связь PM-процессов приложения с нормативной базой управления проектами</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-slate-50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Процесс PM</th>
                  <th className="px-4 py-3 font-semibold">Область знаний</th>
                  <th className="px-4 py-3 font-semibold">Процесс PMBoK 6</th>
                  <th className="px-4 py-3 font-semibold">Страница</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {PMBOK_MAPPING.map(([process, area, pmbok, page]) => (
                  <tr key={process}>
                    <td className="px-4 py-3 font-semibold text-foreground">{process}</td>
                    <td className="px-4 py-3 text-muted-foreground">{area}</td>
                    <td className="px-4 py-3 text-foreground">{pmbok}</td>
                    <td className="px-4 py-3 text-muted-foreground">{page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
