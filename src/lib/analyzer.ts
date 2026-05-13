import { ProcessEvent } from "./demo-data";

export interface ActivityStats {
  activity: string;
  count: number;
  avgDuration: number;
  totalDuration: number;
  uniqueActors: Set<string>;
  uniqueSystems: Set<string>;
}

export interface AutomationScore {
  activity: string;
  score: number;
  freqScore: number;
  durScore: number;
  varScore: number;
  structScore: number;
  frequency: number;
  avgDuration: number;
  recommendation: string;
  tool: string;
  priority: "Высокий" | "Средний" | "Низкий";
}

export interface Recommendation {
  id: string;
  title: string;
  type: "report" | "data" | "approval" | "backlog" | "manual";
  priority: "Высокий" | "Средний" | "Низкий";
  explanation: string;
  effect: string;
  relatedActivities: string[];
  metric: string;
  tool: string;
  effortLevel: "Низкие" | "Средние" | "Высокие";
  timeSaving: string;
}

export interface Transition {
  from: string;
  to: string;
  count: number;
}

export interface ProcessVariant {
  path: string[];
  count: number;
  share: number;
}

export class ProcessAnalyzer {
  events: ProcessEvent[];

  constructor(events: ProcessEvent[]) {
    this.events = events;
  }

  get basicStats() {
    const cases = new Set(this.events.map((e) => e.case_id));
    const activities = new Set(this.events.map((e) => e.activity));
    const actors = new Set(this.events.map((e) => e.actor));

    return {
      totalEvents: this.events.length,
      totalCases: cases.size,
      totalActivities: activities.size,
      totalActors: actors.size,
    };
  }

  private getCaseSequences(): Map<string, string[]> {
    const caseMap = new Map<string, { activity: string; timestamp: string }[]>();

    this.events.forEach((e) => {
      if (!caseMap.has(e.case_id)) caseMap.set(e.case_id, []);
      caseMap.get(e.case_id)!.push({ activity: e.activity, timestamp: e.timestamp });
    });

    const sequences = new Map<string, string[]>();
    caseMap.forEach((events, caseId) => {
      const sorted = [...events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      sequences.set(caseId, sorted.map((e) => e.activity));
    });

    return sequences;
  }

  getTransitions(): Transition[] {
    const transitionMap = new Map<string, number>();
    const sequences = this.getCaseSequences();

    sequences.forEach((seq) => {
      for (let i = 0; i < seq.length - 1; i++) {
        const key = `${seq[i]}|||${seq[i + 1]}`;
        transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
      }
    });

    return Array.from(transitionMap.entries())
      .map(([key, count]) => {
        const [from, to] = key.split("|||");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  getProcessVariants(): ProcessVariant[] {
    const sequences = this.getCaseSequences();
    const variantMap = new Map<string, number>();

    sequences.forEach((seq) => {
      const key = seq.join(" → ");
      variantMap.set(key, (variantMap.get(key) || 0) + 1);
    });

    const total = sequences.size;

    return Array.from(variantMap.entries())
      .map(([key, count]) => ({
        path: key.split(" → "),
        count,
        share: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  getMostFrequentPath(): string[] {
    const variants = this.getProcessVariants();
    return variants.length > 0 ? variants[0].path : [];
  }

  getAvgCaseLength(): number {
    const sequences = this.getCaseSequences();
    if (sequences.size === 0) return 0;
    const total = Array.from(sequences.values()).reduce((sum, seq) => sum + seq.length, 0);
    return Math.round((total / sequences.size) * 10) / 10;
  }

  getActivityStats(): ActivityStats[] {
    const statsMap = new Map<string, ActivityStats>();

    this.events.forEach((e) => {
      if (!statsMap.has(e.activity)) {
        statsMap.set(e.activity, {
          activity: e.activity,
          count: 0,
          avgDuration: 0,
          totalDuration: 0,
          uniqueActors: new Set(),
          uniqueSystems: new Set(),
        });
      }
      const stat = statsMap.get(e.activity)!;
      stat.count += 1;
      stat.totalDuration += Number(e.duration) || 0;
      stat.uniqueActors.add(e.actor);
      stat.uniqueSystems.add(e.system);
    });

    return Array.from(statsMap.values())
      .map((s) => ({
        ...s,
        avgDuration: s.totalDuration / s.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  getCycles(): { case_id: string; activity: string; count: number }[] {
    const caseActivityCounts = new Map<string, Map<string, number>>();

    this.events.forEach((e) => {
      if (!caseActivityCounts.has(e.case_id)) {
        caseActivityCounts.set(e.case_id, new Map());
      }
      const counts = caseActivityCounts.get(e.case_id)!;
      counts.set(e.activity, (counts.get(e.activity) || 0) + 1);
    });

    const cycles: { case_id: string; activity: string; count: number }[] = [];

    caseActivityCounts.forEach((counts, case_id) => {
      counts.forEach((count, activity) => {
        if (count > 1) {
          cycles.push({ case_id, activity, count });
        }
      });
    });

    return cycles;
  }

  getAutomationScores(): AutomationScore[] {
    const stats = this.getActivityStats();
    if (stats.length === 0) return [];

    const maxCount = Math.max(...stats.map((s) => s.count));
    const maxDur = Math.max(...stats.map((s) => s.avgDuration));
    const complexities = stats.map((s) => s.uniqueActors.size + s.uniqueSystems.size);
    const maxComplexity = Math.max(...complexities);
    const minComplexity = Math.min(...complexities);
    const complexityRange = maxComplexity - minComplexity || 1;

    const UNSTRUCTURED_SYSTEMS = new Set(["Email", "Google Meet", "Miro", "Slack"]);

    return stats
      .map((s) => {
        // FrequencyScore: 0-100 (higher freq = easier to automate & higher ROI)
        const freqScore = Math.round((s.count / maxCount) * 100);

        // DurationScore: 0-100 (longer = higher ROI for automation)
        const durScore = Math.round((s.avgDuration / maxDur) * 100);

        // VariabilityScore: 0-100 (lower complexity = more automatable)
        const complexity = s.uniqueActors.size + s.uniqueSystems.size;
        const varScore = Math.round(
          ((maxComplexity - complexity) / complexityRange) * 100
        );

        // StructureScore: 0-100 (system-based > manual/meeting-based)
        const unstructuredCount = Array.from(s.uniqueSystems).filter((sys) =>
          UNSTRUCTURED_SYSTEMS.has(sys)
        ).length;
        const structuredCount = s.uniqueSystems.size - unstructuredCount;
        const structScore =
          s.uniqueSystems.size === 0
            ? 0
            : Math.round((structuredCount / s.uniqueSystems.size) * 100);

        // Ai = 0.35 * Freq + 0.25 * Dur + 0.20 * Var + 0.20 * Struct
        const totalScore = Math.round(
          0.35 * freqScore +
          0.25 * durScore +
          0.20 * varScore +
          0.20 * structScore
        );

        let priority: "Высокий" | "Средний" | "Низкий";
        if (totalScore >= 75) priority = "Высокий";
        else if (totalScore >= 50) priority = "Средний";
        else priority = "Низкий";

        let rec = "Рассмотреть возможность базовой автоматизации.";
        let tool = "Zapier / Make";

        if (totalScore >= 75) {
          if (s.activity.toLowerCase().includes("задач")) {
            rec = "Автоматическое создание задач на основе триггеров (webhook).";
            tool = "Jira Automation / API";
          } else if (s.activity.toLowerCase().includes("согласован")) {
            rec = "Внедрение автоматического флоу аппрувов.";
            tool = "Slack Workflow / Jira";
          } else {
            rec = "Полная автоматизация процесса (RPA).";
            tool = "UiPath / Make";
          }
        } else if (totalScore >= 50) {
          if (
            s.activity.toLowerCase().includes("prd") ||
            s.activity.toLowerCase().includes("требован")
          ) {
            rec = "Генерация шаблонов и автозаполнение полей с помощью AI.";
            tool = "Notion AI / Confluence Templates";
          } else {
            rec = "Частичная автоматизация (шаблоны, скрипты).";
            tool = "Zapier / n8n";
          }
        }

        return {
          activity: s.activity,
          score: totalScore,
          freqScore,
          durScore,
          varScore,
          structScore,
          frequency: s.count,
          avgDuration: Math.round(s.avgDuration),
          recommendation: rec,
          tool,
          priority,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  generateRecommendations(): Recommendation[] {
    const scores = this.getAutomationScores();
    const actStats = this.getActivityStats();
    const cycles = this.getCycles();
    const recs: Recommendation[] = [];

    const find = (keywords: string[]) =>
      actStats.filter((s) =>
        keywords.some((kw) => s.activity.toLowerCase().includes(kw.toLowerCase()))
      );

    const topScore = (activities: typeof actStats) => {
      if (activities.length === 0) return null;
      return scores.find((s) => activities.some((a) => a.activity === s.activity)) ?? null;
    };

    const priorityFromScore = (ai: number | null): "Высокий" | "Средний" | "Низкий" => {
      if (ai === null) return "Низкий";
      if (ai >= 75) return "Высокий";
      if (ai >= 50) return "Средний";
      return "Низкий";
    };

    // 1. Автоматизировать подготовку отчетов
    const reportActivities = find(["метрик", "отчет", "аналитик", "анализ", "dashboard", "данных"]);
    {
      const best = topScore(reportActivities);
      const avgDur = reportActivities.length
        ? Math.round(reportActivities.reduce((s, a) => s + a.avgDuration, 0) / reportActivities.length)
        : 0;
      const priority = priorityFromScore(best?.score ?? null);
      recs.push({
        id: "report",
        type: "report",
        title: "Автоматизировать подготовку отчётов",
        priority,
        explanation: reportActivities.length > 0
          ? `Выявлено ${reportActivities.length} активностей, связанных со сбором и анализом метрик ` +
            `(${reportActivities.slice(0, 2).map((a) => a.activity).join(", ")}). ` +
            `Средняя длительность — ${avgDur} мин. Эти шаги повторяются регулярно и подходят для шаблонизации.`
          : "Регулярная подготовка отчётов занимает значительное время команды и может быть автоматизирована.",
        effect:
          "Сокращение времени на подготовку отчётов на 60–80%. Снижение количества ошибок при ручном сборе данных. " +
          "Освобождение 2–4 часов в неделю для каждого PM.",
        relatedActivities: reportActivities.slice(0, 3).map((a) => a.activity),
        metric: best ? `Ai = ${best.score}` : "—",
        tool: "Looker Studio / Tableau / Notion AI",
        effortLevel: "Средние",
        timeSaving: avgDur > 60 ? "4–8 ч/нед" : "2–4 ч/нед",
      });
    }

    // 2. Автоматизировать сбор данных
    const collectActivities = find(["сбор", "опрос", "интервью", "фидбек", "обратн"]);
    {
      const best = topScore(collectActivities);
      const totalCount = collectActivities.reduce((s, a) => s + a.count, 0);
      const priority = priorityFromScore(best?.score ?? (totalCount > 10 ? 60 : 35));
      recs.push({
        id: "data",
        type: "data",
        title: "Автоматизировать сбор данных",
        priority,
        explanation: collectActivities.length > 0
          ? `Активности по сбору данных встречаются ${totalCount} раз в логах ` +
            `(${collectActivities.slice(0, 2).map((a) => a.activity).join(", ")}). ` +
            "Ручной сбор данных создаёт задержки и снижает точность."
          : "Ручной сбор данных по процессам и метрикам занимает значительное время без добавления ценности.",
        effect:
          "Автоматический сбор данных из Jira, Confluence и других систем. Актуальные данные доступны в реальном времени. " +
          "Устранение ошибок при ручном вводе.",
        relatedActivities: collectActivities.slice(0, 3).map((a) => a.activity),
        metric: best ? `Ai = ${best.score}` : `${totalCount} событий`,
        tool: "Zapier / n8n / Jira API",
        effortLevel: "Низкие",
        timeSaving: "3–6 ч/нед",
      });
    }

    // 3. Сократить циклы согласования
    {
      const approvalActivities = find(["согласован", "аппрув", "ревью", "review", "утвержден"]);
      const cycleCount = cycles.filter((c) =>
        approvalActivities.some((a) => a.activity === c.activity)
      ).length;
      const totalCycles = cycles.length;
      const priority: "Высокий" | "Средний" | "Низкий" =
        cycleCount >= 3 || totalCycles >= 5 ? "Высокий" : totalCycles >= 2 ? "Средний" : "Низкий";
      const bestApproval = topScore(approvalActivities);
      recs.push({
        id: "approval",
        type: "approval",
        title: "Сократить циклы согласования",
        priority,
        explanation:
          `В логах обнаружено ${totalCycles} циклических возвратов. ` +
          (approvalActivities.length > 0
            ? `Согласование (${approvalActivities.slice(0, 2).map((a) => a.activity).join(", ")}) ` +
              "проходит несколько итераций, что удлиняет процесс."
            : "Возвраты на повторные согласования удлиняют цикл разработки и снижают скорость доставки."),
        effect:
          "Сокращение итераций согласования с 3–5 до 1–2. Уменьшение lead time на 20–35%. " +
          "Прозрачность статуса для всех участников в реальном времени.",
        relatedActivities: approvalActivities.slice(0, 3).map((a) => a.activity),
        metric: `${totalCycles} циклов в логах`,
        tool: "Slack Workflow Builder / Jira Automation",
        effortLevel: "Средние",
        timeSaving: "5–10 ч/нед",
      });
    }

    // 4. Стандартизировать обновление backlog
    {
      const backlogActivities = find(["backlog", "бэклог", "приоритиз", "планирован", "спринт"]);
      const best = topScore(backlogActivities);
      const maxActors = backlogActivities.length
        ? Math.max(...backlogActivities.map((a) => a.uniqueActors.size))
        : 0;
      const priority = priorityFromScore(best?.score ?? null);
      recs.push({
        id: "backlog",
        type: "backlog",
        title: "Стандартизировать обновление Backlog",
        priority,
        explanation: backlogActivities.length > 0
          ? `Работа с backlog охватывает ${backlogActivities.length} видов активностей ` +
            `(${backlogActivities.slice(0, 2).map((a) => a.activity).join(", ")}). ` +
            (maxActors > 1
              ? `В процессе участвует до ${maxActors} разных акторов — высокая вариативность.`
              : "Процесс недостаточно стандартизирован.")
          : "Обновление backlog часто происходит нерегулярно и без единого стандарта, что замедляет планирование.",
        effect:
          "Единый шаблон карточки задачи сокращает время заведения на 40%. Регулярные grooming-сессии " +
          "по расписанию уменьшают блокеры в спринтах. Повышение качества оценок задач.",
        relatedActivities: backlogActivities.slice(0, 3).map((a) => a.activity),
        metric: best ? `Ai = ${best.score}` : `${backlogActivities.length} активностей`,
        tool: "Jira Templates / Confluence Playbook",
        effortLevel: "Низкие",
        timeSaving: "2–3 ч/нед",
      });
    }

    // 5. Уменьшить ручную обработку данных
    {
      const MANUAL_SYSTEMS = new Set(["Email", "Google Meet", "Miro"]);
      const manualActivities = actStats.filter((s) =>
        Array.from(s.uniqueSystems).some((sys) => MANUAL_SYSTEMS.has(sys))
      );
      const manualScore = scores.find((s) =>
        manualActivities.some((a) => a.activity === s.activity)
      );
      const manualCount = manualActivities.reduce((sum, a) => sum + a.count, 0);
      const priority: "Высокий" | "Средний" | "Низкий" =
        manualCount >= 20 ? "Высокий" : manualCount >= 10 ? "Средний" : "Низкий";
      recs.push({
        id: "manual",
        type: "manual",
        title: "Уменьшить ручную обработку данных",
        priority,
        explanation:
          `${manualActivities.length} активностей выполняются через неструктурированные каналы ` +
          `(Email, Miro, Google Meet) — всего ${manualCount} событий. ` +
          "Данные вносятся вручную, что создаёт риски потери информации и ошибок.",
        effect:
          "Перенос коммуникаций в структурированные системы. Автоматическая фиксация решений. " +
          "Снижение потерь информации на 70%. Ускорение онбординга новых членов команды.",
        relatedActivities: manualActivities.slice(0, 3).map((a) => a.activity),
        metric: `${manualCount} событий вручную`,
        tool: "Notion / Confluence / Loom",
        effortLevel: "Высокие",
        timeSaving: "3–5 ч/нед",
      });
    }

    // Sort by priority weight
    const weight = { Высокий: 3, Средний: 2, Низкий: 1 };
    return recs.sort((a, b) => weight[b.priority] - weight[a.priority]);
  }
}
