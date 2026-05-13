import { Link } from "wouter";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Route, Upload } from "lucide-react";
import { getToBeModels } from "@/lib/pm-insights";

export default function ToBeModel() {
  const { events, analyzer } = useData();

  if (events.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Route className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных для TO-BE модели</h2>
        <p className="max-w-sm text-muted-foreground">
          Сначала загрузите процессы, чтобы построить целевую модель автоматизации.
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

  const models = getToBeModels(analyzer);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground sm:text-3xl">TO-BE модель процессов</h1>
        <p className="mt-2 text-muted-foreground">
          Целевое состояние: что должно измениться после автоматизации и какой артефакт должен появиться.
        </p>
      </div>

      <div className="space-y-5">
        {models.map((model, index) => (
          <Card key={`${model.process}-${index}`} className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-slate-50/70 p-4 sm:p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <Badge variant="outline" className="mb-2">Процесс #{index + 1}</Badge>
                  <CardTitle className="break-words">{model.process}</CardTitle>
                  <CardDescription className="mt-1">{model.pmbok}</CardDescription>
                </div>
                <Badge className="shrink-0 bg-emerald-600">TO-BE</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <StateBlock title="AS-IS проблема" text={model.currentIssue} tone="red" />
                <div className="hidden items-center justify-center lg:flex">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <StateBlock title="TO-BE состояние" text={model.targetState} tone="green" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <ListBlock title="Входы" items={model.inputs} />
                <ListBlock title="Выходы" items={model.outputs} />
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-blue-700">Автоматизация</p>
                  <p className="mt-2 font-semibold text-blue-950">{model.automation}</p>
                  <p className="mt-3 text-sm text-blue-900">{model.expectedEffect}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StateBlock({ title, text, tone }: { title: string; text: string; tone: "red" | "green" }) {
  const classes =
    tone === "red"
      ? "border-rose-200 bg-rose-50 text-rose-950"
      : "border-emerald-200 bg-emerald-50 text-emerald-950";

  return (
    <div className={`rounded-lg border p-4 ${classes}`}>
      <p className="text-xs font-semibold uppercase opacity-70">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/50 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
