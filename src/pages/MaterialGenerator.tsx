import { useState } from "react";
import { Link } from "wouter";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, Upload } from "lucide-react";
import { generateMaterialDrafts } from "@/lib/pm-insights";

export default function MaterialGenerator() {
  const { events, analyzer } = useData();
  const [selected, setSelected] = useState("weekly");

  if (events.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Нет данных для генерации</h2>
        <p className="max-w-sm text-muted-foreground">
          Материалы собираются из загруженных процессов, активностей и рекомендаций.
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

  const drafts = generateMaterialDrafts(analyzer);
  const active = drafts.find((draft) => draft.id === selected) ?? drafts[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Генератор PM-материалов</h1>
        <p className="mt-2 text-muted-foreground">
          Повторяющиеся отчёты, повестки и сводки создаются из актуальных данных процесса.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Шаблоны</CardTitle>
            <CardDescription>Выберите материал, который PM обычно пишет вручную</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => setSelected(draft.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selected === draft.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{draft.title}</p>
                  {selected === draft.id && <Badge>Выбран</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{active.title}</CardTitle>
                <CardDescription>{active.description}</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard?.writeText(active.content)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Скопировать
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={active.content} readOnly className="min-h-[360px] resize-none font-mono text-sm leading-relaxed" />
            <p className="mt-3 text-xs text-muted-foreground">
              Это шаблонная генерация без внешнего AI API. При необходимости сюда можно подключить LLM и оставить эти данные как контекст.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
