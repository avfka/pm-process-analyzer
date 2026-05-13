import { ProcessEvent } from "./demo-data";
import { AutomationScore, ProcessAnalyzer } from "./analyzer";

export type WorkloadCategory =
  | "Стратегия и discovery"
  | "Контент и документы"
  | "Backlog и планирование"
  | "Согласования"
  | "Встречи и коммуникации"
  | "Данные и отчётность";

export interface WorkloadSlice {
  category: WorkloadCategory;
  minutes: number;
  hours: number;
  share: number;
  events: number;
  topActivities: string[];
}

export interface ImpactInput {
  teamSize: number;
  monthlySalary: number;
  workHoursPerMonth: number;
  contentHeavyShare: number;
}

export interface ImpactResult {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  monthlyRub: number;
  yearlyRub: number;
  hourlyRate: number;
  heavyHours: number;
  lightHours: number;
}

export interface MaterialDraft {
  id: string;
  title: string;
  description: string;
  content: string;
}

export interface ToBeModel {
  process: string;
  currentIssue: string;
  targetState: string;
  inputs: string[];
  outputs: string[];
  automation: string;
  pmbok: string;
  expectedEffect: string;
}

export interface RecommendationEvidence {
  source: string;
  pmbok: string;
}

export interface AutomationDetail {
  toBe: string;
  asIsWeekly: number;
  toBeWeekly: number;
  savingPercent: number;
  monthlyRub: number;
  pmbok: string;
}

export const PM_MONTHLY_SALARY = 200000;
export const WORK_HOURS_PER_MONTH = 168;
export const MCKINSEY_AI_TIME_REDUCTION = 0.4;
export const WEEKS_PER_MONTH = 4.3;

export const RECOMMENDATION_EVIDENCE_BY_ID: Record<string, RecommendationEvidence> = {
  report: {
    source: "McKinsey, 2024: использование AI сокращает время подготовки отчётов на 40%",
    pmbok: "PMBoK 6 · 10.2 Manage Communications · p. 379 · PMIS, шаблоны, автоматическая рассылка",
  },
  approval: {
    source: "BCG, 2024: автоматизация согласований сокращает lead time на 20–35%",
    pmbok: "PMBoK 6 · 13.3 Manage Stakeholder Engagement · управление ожиданиями и коммуникациями",
  },
  backlog: {
    source: "Asana Anatomy of Work, 2023: улучшение процессов экономит до 4.9 ч/нед",
    pmbok: "PMBoK 6 · 5.2 Collect Requirements · формализация требований и критериев готовности",
  },
  manual: {
    source: "Asana Anatomy of Work, 2023: 58% рабочего дня уходит на work about work",
    pmbok: "PMBoK 6 · 10.1 Plan Communications · планирование каналов, форматов и владельцев коммуникаций",
  },
  data: {
    source: "McKinsey, 2024: AI сокращает контентно-лёгкие задачи на 15%",
    pmbok: "PMBoK 6 · 4.5 Monitor and Control Project Work · мониторинг статусов, данных и отклонений",
  },
};

const CATEGORY_RULES: Record<WorkloadCategory, string[]> = {
  "Стратегия и discovery": ["discovery", "гипотез", "заказчик", "требован", "интервью", "исслед"],
  "Контент и документы": ["prd", "специфик", "отчет", "отчёт", "сводк", "повест", "документ"],
  "Backlog и планирование": ["jira", "backlog", "бэклог", "задач", "спринт", "планирован", "приорит"],
  "Согласования": ["соглас", "аппрув", "ревью", "review", "утвержд"],
  "Встречи и коммуникации": ["встреч", "meet", "ретро", "стендап", "команд", "slack", "email"],
  "Данные и отчётность": ["метрик", "аналит", "данн", "dashboard", "amplitude", "looker"],
};

const CATEGORY_ORDER = Object.keys(CATEGORY_RULES) as WorkloadCategory[];
const UNSTRUCTURED_SYSTEMS = new Set(["Email", "Google Meet", "Miro", "Slack"]);
const HOURLY_RATE = PM_MONTHLY_SALARY / WORK_HOURS_PER_MONTH;
const MINUTE_RATE = PM_MONTHLY_SALARY / (WORK_HOURS_PER_MONTH * 60);

export function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function matchCategory(event: ProcessEvent): WorkloadCategory {
  const text = `${event.activity} ${event.system}`.toLowerCase();
  return (
    CATEGORY_ORDER.find((category) =>
      CATEGORY_RULES[category].some((keyword) => text.includes(keyword))
    ) ?? "Стратегия и discovery"
  );
}

export function getWorkloadSlices(events: ProcessEvent[]): WorkloadSlice[] {
  const totalMinutes = events.reduce((sum, event) => sum + Number(event.duration || 0), 0) || 1;
  const buckets = new Map<WorkloadCategory, ProcessEvent[]>();
  CATEGORY_ORDER.forEach((category) => buckets.set(category, []));

  events.forEach((event) => {
    buckets.get(matchCategory(event))!.push(event);
  });

  return CATEGORY_ORDER.map((category) => {
    const bucket = buckets.get(category) ?? [];
    const minutes = bucket.reduce((sum, event) => sum + Number(event.duration || 0), 0);
    const activityCounts = new Map<string, number>();
    bucket.forEach((event) => {
      activityCounts.set(event.activity, (activityCounts.get(event.activity) ?? 0) + 1);
    });

    return {
      category,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
      share: Math.round((minutes / totalMinutes) * 100),
      events: bucket.length,
      topActivities: Array.from(activityCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([activity]) => activity),
    };
  }).sort((a, b) => b.minutes - a.minutes);
}

export function getWorkAboutWork(events: ProcessEvent[]) {
  const operational = events.filter((event) => {
    const category = matchCategory(event);
    return category !== "Стратегия и discovery";
  });
  const minutes = operational.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const total = events.reduce((sum, event) => sum + Number(event.duration || 0), 0) || 1;

  return {
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    share: Math.round((minutes / total) * 100),
  };
}

export function estimateWeeklyRecoverableHours(events: ProcessEvent[]) {
  const workAboutWork = getWorkAboutWork(events);
  return Math.round(Math.min(4.9, workAboutWork.hours * 0.4) * 10) / 10;
}

export function calculateImpact(events: ProcessEvent[], input: ImpactInput): ImpactResult {
  const weeklyRecoverable = estimateWeeklyRecoverableHours(events);
  const heavyShare = input.contentHeavyShare / 100;
  const heavyHours = weeklyRecoverable * heavyShare;
  const lightHours = weeklyRecoverable * (1 - heavyShare);
  const weeklyHours = heavyHours * 0.4 + lightHours * 0.15;
  const monthlyHours = weeklyHours * 4.33 * input.teamSize;
  const yearlyHours = monthlyHours * 12;
  const hourlyRate = input.monthlySalary / input.workHoursPerMonth;

  return {
    weeklyHours: Math.round(weeklyHours * input.teamSize * 10) / 10,
    monthlyHours: Math.round(monthlyHours),
    yearlyHours: Math.round(yearlyHours),
    monthlyRub: Math.round(monthlyHours * hourlyRate),
    yearlyRub: Math.round(yearlyHours * hourlyRate),
    hourlyRate: Math.round(hourlyRate),
    heavyHours: Math.round(heavyHours * input.teamSize * 10) / 10,
    lightHours: Math.round(lightHours * input.teamSize * 10) / 10,
  };
}

function isContentHeavy(activity: string) {
  const text = activity.toLowerCase();
  return ["отчет", "отчёт", "метрик", "аналит", "prd", "специфик", "документ", "сводк"].some((keyword) =>
    text.includes(keyword)
  );
}

function getAutomationPmbok(activity: string) {
  const text = activity.toLowerCase();
  if (["соглас", "ревью", "review", "аппрув"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 13.3 Manage Stakeholder Engagement";
  }
  if (["jira", "создание задачи", "задач"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 5.6 Control Scope";
  }
  if (["prd", "требован"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 5.2 Collect Requirements";
  }
  if (["backlog", "бэклог", "приорит"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 5.6 Control Scope";
  }
  if (["отчет", "отчёт", "метрик", "аналит"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 4.5 Monitor and Control Project Work";
  }
  if (["сбор", "данн", "опрос", "фидбек"].some((keyword) => text.includes(keyword))) {
    return "PMBoK 6 · 4.5 Monitor and Control Project Work";
  }
  return "PMBoK 6 · 10.1 Plan Communications";
}

function getToBeText(activity: string) {
  const text = activity.toLowerCase();
  if (["отчет", "отчёт", "метрик", "аналит"].some((keyword) => text.includes(keyword))) {
    return "Автоматическая генерация по шаблону через Jira/Amplitude API → PDF → рассылка по расписанию. PM только проверяет выводы.";
  }
  if (["jira", "backlog", "бэклог", "задач", "приорит"].some((keyword) => text.includes(keyword))) {
    return "Автосоздание и обновление задач по шаблону: обязательные поля, критерии готовности и приоритет проставляются до планирования.";
  }
  if (["соглас", "ревью", "review", "аппрув"].some((keyword) => text.includes(keyword))) {
    return "Workflow согласования с SLA, автоуведомлениями и фиксацией решения в системе вместо ручных follow-up сообщений.";
  }
  if (["сбор", "данн", "опрос", "фидбек"].some((keyword) => text.includes(keyword))) {
    return "Интеграция источников данных без ручного копирования: события автоматически попадают в рабочий контур PM.";
  }
  return "Шаблон процесса и автоматическая фиксация результата: PM работает с исключениями, а не с ручным переносом данных.";
}

export function getAutomationDetail(score: AutomationScore, events: ProcessEvent[]): AutomationDetail {
  const asIsWeekly = score.avgDuration * score.frequency / WEEKS_PER_MONTH;
  const toBeWeekly = isContentHeavy(score.activity) ? 15 : Math.max(10, asIsWeekly * 0.15);
  const savedWeekly = Math.max(0, asIsWeekly - toBeWeekly);
  const savingPercent = asIsWeekly > 0 ? Math.round((savedWeekly / asIsWeekly) * 100) : 0;
  const monthlyRub = savedWeekly * WEEKS_PER_MONTH * MINUTE_RATE;

  return {
    toBe: getToBeText(score.activity),
    asIsWeekly: Math.round(asIsWeekly),
    toBeWeekly: Math.round(toBeWeekly),
    savingPercent,
    monthlyRub: Math.round(monthlyRub),
    pmbok: getAutomationPmbok(score.activity),
  };
}

export function getDashboardMetrics(events: ProcessEvent[]) {
  const totalMinutes = events.reduce((sum, event) => sum + Number(event.duration || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const monthlySavingRub = totalMinutes * MCKINSEY_AI_TIME_REDUCTION * MINUTE_RATE;
  const routineHoursPerWeek = totalMinutes / WEEKS_PER_MONTH / 60;

  return {
    totalMinutes,
    totalHours,
    monthlySavingRub: Math.round(monthlySavingRub),
    routineHoursPerWeek: Math.round(routineHoursPerWeek * 10) / 10,
  };
}

function getToBeIO(process: string, recType: string) {
  const text = process.toLowerCase();

  if (["метрик", "аналит"].some((keyword) => text.includes(keyword)) || recType === "report") {
    return {
      inputs: ["BI-дашборд", "Amplitude", "Данные retention", "Целевые продуктовые метрики"],
      outputs: ["Автоматический daily report", "Алерты аномалий", "Список продуктовых гипотез"],
    };
  }

  if (["соглас", "prd", "ревью", "review"].some((keyword) => text.includes(keyword)) || recType === "approval") {
    return {
      inputs: ["Черновик PRD", "Комментарии стейкхолдеров", "Критерии готовности", "История изменений"],
      outputs: ["Подписанный PRD", "Трассируемые требования", "Список открытых вопросов"],
    };
  }

  if (["backlog", "бэклог", "приорит"].some((keyword) => text.includes(keyword)) || recType === "backlog") {
    return {
      inputs: ["Пользовательский фидбек", "Метрики", "Техдолг", "Оценки команды"],
      outputs: ["Упорядоченный backlog с оценками", "Приоритеты на спринт", "Обоснование решений"],
    };
  }

  if (["email", "slack", "meet", "встреч", "коммуникац"].some((keyword) => text.includes(keyword)) || recType === "manual") {
    return {
      inputs: ["Сообщения Slack/email", "Решения митингов", "Контекст обсуждений", "Ответственные"],
      outputs: ["Зафиксированные решения в Confluence", "Назначенные action items", "История договорённостей"],
    };
  }

  return {
    inputs: ["Сырые данные процесса", "Источник событий", "Правила обработки", "Ответственный PM"],
    outputs: ["Структурированный набор данных", "Обновлённый статус", "Метрика качества данных"],
  };
}

function topNames(scores: AutomationScore[], count = 3) {
  return scores.slice(0, count).map((score) => score.activity);
}

export function generateMaterialDrafts(analyzer: ProcessAnalyzer): MaterialDraft[] {
  const stats = analyzer.basicStats;
  const scores = analyzer.getAutomationScores();
  const topActivities = topNames(scores);
  const cycles = analyzer.getCycles();
  const variants = analyzer.getProcessVariants();
  const recommendations = analyzer.generateRecommendations().slice(0, 3);

  return [
    {
      id: "weekly",
      title: "Еженедельный статус для руководства",
      description: "Сводка по операционной нагрузке, рискам и приоритетам автоматизации.",
      content: [
        "Еженедельный статус PM operations",
        "",
        `1. Обработано процессов: ${stats.totalCases}. Событий в логе: ${stats.totalEvents}.`,
        `2. Основные повторяющиеся активности: ${topActivities.join(", ") || "нет данных"}.`,
        `3. Вариативность процесса: ${variants.length} уникальных сценариев.`,
        `4. Возвраты и rework: ${cycles.length} обнаруженных повторов.`,
        `5. Приоритет автоматизации на неделю: ${recommendations[0]?.title ?? "уточнить после загрузки данных"}.`,
        "",
        "Решение, которое требуется от руководства: согласовать пилот автоматизации для топ-3 процессов по Ai.",
      ].join("\n"),
    },
    {
      id: "standup",
      title: "Повестка стендапа по операционным блокерам",
      description: "Короткая agenda для обсуждения повторов, согласований и ручных шагов.",
      content: [
        "Повестка стендапа",
        "",
        "1. Какие процессы застряли на согласовании?",
        `2. Какие активности повторялись чаще всего: ${topActivities.join(", ") || "нет данных"}?`,
        `3. Где появился rework: ${cycles.slice(0, 3).map((c) => c.activity).join(", ") || "не найдено"}?`,
        "4. Какие ручные действия можно заменить шаблоном или workflow?",
        "5. Кто владелец следующего шага по автоматизации?",
      ].join("\n"),
    },
    {
      id: "backlog",
      title: "Сводка для backlog grooming",
      description: "Готовый текст для приоритизации задач автоматизации.",
      content: [
        "Backlog automation summary",
        "",
        ...recommendations.map(
          (rec, index) =>
            `${index + 1}. ${rec.title}: ${rec.metric}; эффект: ${rec.timeSaving}; инструмент: ${rec.tool}.`
        ),
        "",
        "Рекомендуемое действие: создать отдельные backlog items для процессов с высоким Ai и низкими/средними усилиями внедрения.",
      ].join("\n"),
    },
  ];
}

export function getToBeModels(analyzer: ProcessAnalyzer): ToBeModel[] {
  const scores = analyzer.getAutomationScores();
  const recommendations = analyzer.generateRecommendations();

  return recommendations.slice(0, 5).map((rec, index) => {
    const score = scores.find((item) => rec.relatedActivities.includes(item.activity));
    const process = rec.relatedActivities[0] ?? rec.title;
    const isManual = rec.type === "manual" || rec.type === "approval";
    const io = getToBeIO(process, rec.type);

    return {
      process,
      currentIssue: rec.explanation,
      targetState:
        rec.type === "report"
          ? "Единый регламент отчётности: данные собираются автоматически, PM проверяет выводы и добавляет управленческий комментарий."
          : rec.type === "backlog"
            ? "Единый lifecycle backlog item: входные данные, критерии готовности, оценка и приоритет фиксируются до планирования."
            : isManual
              ? "Структурированный workflow с владельцем, SLA, статусом и автоматической фиксацией результата."
              : "Автоматизированный поток данных между системами без ручного копирования и повторного ввода.",
      inputs: io.inputs,
      outputs: io.outputs,
      automation: rec.tool,
      pmbok:
        index % 2 === 0
          ? "PMBoK 6: Monitor and Control Project Work, Manage Communications, Control Quality."
          : "PMBoK 6: Collect Requirements, Define Scope, Manage Stakeholder Engagement.",
      expectedEffect: `${rec.effect} ${score ? `Приоритет подтверждён Ai = ${score.score}.` : ""}`,
    };
  });
}

export { UNSTRUCTURED_SYSTEMS };
