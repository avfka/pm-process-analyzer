export interface ProcessEvent {
  case_id: string;
  activity: string;
  timestamp: string;
  actor: string;
  system: string;
  duration: number;
}

export const DEMO_DATA: ProcessEvent[] = [
  // Case 1: Standard Feature
  { case_id: "FEAT-101", activity: "Сбор требований", timestamp: "2023-10-01T09:00:00Z", actor: "Иванов А.", system: "Miro", duration: 120 },
  { case_id: "FEAT-101", activity: "Написание PRD", timestamp: "2023-10-02T10:00:00Z", actor: "Иванов А.", system: "Confluence", duration: 240 },
  { case_id: "FEAT-101", activity: "Согласование PRD", timestamp: "2023-10-03T11:00:00Z", actor: "Петрова М.", system: "Email", duration: 45 },
  { case_id: "FEAT-101", activity: "Создание задачи в Jira", timestamp: "2023-10-03T14:00:00Z", actor: "Иванов А.", system: "Jira", duration: 15 },
  { case_id: "FEAT-101", activity: "Планирование спринта", timestamp: "2023-10-05T10:00:00Z", actor: "Козлов Н.", system: "Google Meet", duration: 60 },
  
  // Case 2: Bugfix (Cycle example)
  { case_id: "BUG-202", activity: "Анализ метрик", timestamp: "2023-10-01T10:30:00Z", actor: "Сидоров Д.", system: "Amplitude", duration: 90 },
  { case_id: "BUG-202", activity: "Создание задачи в Jira", timestamp: "2023-10-01T12:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 10 },
  { case_id: "BUG-202", activity: "Ревью спецификации", timestamp: "2023-10-02T09:00:00Z", actor: "Петрова М.", system: "Confluence", duration: 30 },
  { case_id: "BUG-202", activity: "Создание задачи в Jira", timestamp: "2023-10-02T10:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 15 }, // Cycle
  
  // Case 3: Complex Feature
  { case_id: "FEAT-103", activity: "Встреча с заказчиком", timestamp: "2023-10-04T15:00:00Z", actor: "Иванов А.", system: "Google Meet", duration: 60 },
  { case_id: "FEAT-103", activity: "Сбор требований", timestamp: "2023-10-05T09:00:00Z", actor: "Иванов А.", system: "Miro", duration: 180 },
  { case_id: "FEAT-103", activity: "Написание PRD", timestamp: "2023-10-06T10:00:00Z", actor: "Иванов А.", system: "Confluence", duration: 300 },
  { case_id: "FEAT-103", activity: "Согласование PRD", timestamp: "2023-10-07T11:00:00Z", actor: "Петрова М.", system: "Email", duration: 120 },
  { case_id: "FEAT-103", activity: "Написание PRD", timestamp: "2023-10-08T10:00:00Z", actor: "Иванов А.", system: "Confluence", duration: 60 }, // Rework
  { case_id: "FEAT-103", activity: "Согласование PRD", timestamp: "2023-10-09T11:00:00Z", actor: "Петрова М.", system: "Slack", duration: 20 },
  { case_id: "FEAT-103", activity: "Создание задачи в Jira", timestamp: "2023-10-09T14:00:00Z", actor: "Иванов А.", system: "Jira", duration: 20 },
  { case_id: "FEAT-103", activity: "Приоритизация бэклога", timestamp: "2023-10-10T09:00:00Z", actor: "Козлов Н.", system: "Jira", duration: 45 },
  
  // Case 4: Routine Maintenance
  { case_id: "MAINT-404", activity: "Обновление дорожной карты", timestamp: "2023-10-10T14:00:00Z", actor: "Козлов Н.", system: "Notion", duration: 90 },
  { case_id: "MAINT-404", activity: "Встреча с командой", timestamp: "2023-10-11T10:00:00Z", actor: "Иванов А.", system: "Google Meet", duration: 30 },
  { case_id: "MAINT-404", activity: "Приоритизация бэклога", timestamp: "2023-10-11T11:00:00Z", actor: "Козлов Н.", system: "Jira", duration: 60 },
  
  // Case 5: Discovery
  { case_id: "DISC-505", activity: "Анализ метрик", timestamp: "2023-10-12T09:00:00Z", actor: "Сидоров Д.", system: "Amplitude", duration: 120 },
  { case_id: "DISC-505", activity: "Встреча с заказчиком", timestamp: "2023-10-13T14:00:00Z", actor: "Иванов А.", system: "Google Meet", duration: 60 },
  { case_id: "DISC-505", activity: "Сбор требований", timestamp: "2023-10-14T10:00:00Z", actor: "Иванов А.", system: "Miro", duration: 150 },
  { case_id: "DISC-505", activity: "Ревью спецификации", timestamp: "2023-10-15T11:00:00Z", actor: "Петрова М.", system: "Confluence", duration: 40 },
  
  // Random extra events to pad out data
  { case_id: "FEAT-106", activity: "Создание задачи в Jira", timestamp: "2023-10-16T09:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 15 },
  { case_id: "FEAT-107", activity: "Создание задачи в Jira", timestamp: "2023-10-16T09:30:00Z", actor: "Сидоров Д.", system: "Jira", duration: 12 },
  { case_id: "FEAT-108", activity: "Создание задачи в Jira", timestamp: "2023-10-16T10:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 18 },
  { case_id: "FEAT-109", activity: "Создание задачи в Jira", timestamp: "2023-10-16T10:30:00Z", actor: "Сидоров Д.", system: "Jira", duration: 14 },
  { case_id: "FEAT-110", activity: "Создание задачи в Jira", timestamp: "2023-10-16T11:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 16 },
  
  { case_id: "RETRO-01", activity: "Ретроспектива", timestamp: "2023-10-17T15:00:00Z", actor: "Козлов Н.", system: "Miro", duration: 60 },
  { case_id: "RETRO-02", activity: "Ретроспектива", timestamp: "2023-10-31T15:00:00Z", actor: "Козлов Н.", system: "Miro", duration: 60 },
  
  { case_id: "BUG-203", activity: "Анализ метрик", timestamp: "2023-10-18T10:00:00Z", actor: "Сидоров Д.", system: "Amplitude", duration: 45 },
  { case_id: "BUG-203", activity: "Согласование с заказчиком", timestamp: "2023-10-18T11:00:00Z", actor: "Петрова М.", system: "Email", duration: 30 },
  { case_id: "BUG-203", activity: "Создание задачи в Jira", timestamp: "2023-10-18T14:00:00Z", actor: "Сидоров Д.", system: "Jira", duration: 10 },
];
