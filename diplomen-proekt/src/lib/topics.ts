export interface Topic {
  id: number;
  name: string;
  subject: "Български език" | "Литература";
  priority: number;
}

export const ALL_TOPICS: Topic[] = [

  { id: 1, name: "Фонетика и правопис", subject: "Български език", priority: 10 },
  { id: 2, name: "Лексика и фразеология", subject: "Български език", priority: 9 },
  { id: 3, name: "Словообразуване", subject: "Български език", priority: 6 },
  { id: 4, name: "Морфология - Съществително име", subject: "Български език", priority: 7 },
  { id: 5, name: "Морфология - Прилагателно име", subject: "Български език", priority: 7 },
  { id: 6, name: "Морфология - Глагол", subject: "Български език", priority: 10 },
  { id: 7, name: "Морфология - Числително име", subject: "Български език", priority: 7 },
  { id: 8, name: "Морфология - Местоимение", subject: "Български език", priority: 8 },
  { id: 9, name: "Морфология - Наречие", subject: "Български език", priority: 7 },
  { id: 10, name: "Морфология - Предлог", subject: "Български език", priority: 6 },
  { id: 11, name: "Морфология - Съюз", subject: "Български език", priority: 6 },
  { id: 12, name: "Морфология - Частица", subject: "Български език", priority: 5 },
  { id: 13, name: "Морфология - Междуметие", subject: "Български език", priority: 4 },
  { id: 14, name: "Синтаксис: Части на изречението - Подлог", subject: "Български език", priority: 9 },
  { id: 15, name: "Синтаксис: Части на изречението - Сказуемо", subject: "Български език", priority: 9 },
  { id: 16, name: "Синтаксис: Части на изречението - Определение", subject: "Български език", priority: 8 },
  { id: 17, name: "Синтаксис: Части на изречението - Допълнение", subject: "Български език", priority: 8 },
  { id: 18, name: "Синтаксис: Части на изречението - Обстоятелство", subject: "Български език", priority: 7 },
  { id: 19, name: "Синтаксис - Просто изречение", subject: "Български език", priority: 9 },
  { id: 20, name: "Синтаксис - Сложно изречение", subject: "Български език", priority: 8 },
  { id: 21, name: "Синтаксис - Сложно подчинено изречение", subject: "Български език", priority: 8 },
  { id: 22, name: "Синтаксис - Сложно съчинено изречение", subject: "Български език", priority: 7 },
  { id: 23, name: "Стилистика", subject: "Български език", priority: 6 },
  { id: 24, name: "Текст и интерпретация", subject: "Български език", priority: 6 },


  { id: 25, name: "\"Железният светилник\" - Димитър Талев", subject: "Литература", priority: 10 },
  { id: 26, name: "\"Из Бай Ганьо. Невероятни разкази за един съвременнен българин: Бай Ганьо журналист\" - Алеко Константинов", subject: "Литература", priority: 7 },
  { id: 27, name: "\"Балкански синдром\" - Станислав Стратиев ", subject: "Литература", priority: 8 },
  { id: 28, name: " Родното и чуждото - междутекстови връзки ", subject: "Литература", priority: 8 },
  { id: 29, name: "\"Паисий\" - Иван Вазов ", subject: "Литература", priority: 8 },
  { id: 30, name: "\"История\" - Никола Вапцаров ", subject: "Литература", priority: 7 },
  { id: 31, name: "\"Ноев ковчег\" - Йордан Йовков ", subject: "Литература", priority: 10},
  { id: 32, name: " Миналото и паметта - междутекстови връзки ", subject: "Литература", priority: 8 },
  { id: 33, name: "\"Борба\" - Христо  Ботев ", subject: "Литература", priority: 7 },
  { id: 34, name: "\"Андрешко\" - Елин Пелин ", subject: "Литература", priority: 7 },
  { id: 35, name: "\"Приказка за стълбата\" - Христо Смирненски ", subject: "Литература", priority: 7 },
  { id: 36, name: " Обществото и властта - междутекстови връзки ", subject: "Литература", priority: 6 },
  { id: 37, name: "\"До моето първо либе\" - Христо Ботев ", subject: "Литература", priority: 9 },
  { id: 38, name: "\"Новото гробище над Сливница\" - Иван Вазов ", subject: "Литература", priority: 8 },
  { id: 39, name: "\"Крадецът на праскови\" - Емилиян Станев ", subject: "Литература", priority: 7 },
  { id: 40, name: " Животът и смъртта - междутекстови връзки ", subject: "Литература", priority: 7 },
  { id: 41, name: " \"При Рислския манастир\" - Иван Вазов ", subject: "Литература", priority: 8 },
  { id: 42, name: " \"Градушка\" - Пейо Яворов ", subject: "Литература", priority: 8 },
  { id: 43, name: " \"Спи езерото\" - Пенчо Славейков ", subject: "Литература", priority: 9 },
  { id: 44, name: "Природата - междутекстови връзки ", subject: "Литература", priority: 9 },
];

export type KnowledgeLevel = "beginner" | "intermediate" | "advanced";

export const KnowledgeLevelValues = ["beginner", "intermediate", "advanced"] as const;

export interface StudyPlanPreferences {
  examDate: Date;
  studyDaysPerWeek: number;
  topicsPerDay: number;
  belLevel: KnowledgeLevel;
  literatureLevel: KnowledgeLevel;
}

export interface StudyDay {
  date: string; // YYYY-MM-DD
  topics: Topic[];
  completed?: boolean;
  missed?: boolean;
}

export interface StudyPlan {
  id?: string;
  user_id: string;
  preferences: StudyPlanPreferences;
  plan: StudyDay[];
  created_at?: string;
  updated_at?: string;
}
