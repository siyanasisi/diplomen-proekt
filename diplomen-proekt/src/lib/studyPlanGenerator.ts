import type { KnowledgeLevel, StudyPlanPreferences, StudyDay, StudyPlan, Topic } from './topics';
import { ALL_TOPICS } from './topics';

export function generateStudyPlan(
  preferences: StudyPlanPreferences,
  userId: string
): StudyPlan {
  const { examSubject, examDate, studyDaysPerWeek, topicsPerDay, belLevel, literatureLevel } = preferences;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  
  const daysUntilExam = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExam <= 0) {
    throw new Error('Датата на изпита трябва да бъде в бъдещето');
  }

  const topicsBySubject = filterTopicsByExamSubject(ALL_TOPICS, examSubject);
  const filteredTopics = filterTopicsByLevel(topicsBySubject, belLevel, literatureLevel, examSubject);
  const studyDays = generateStudyDays(
    today,
    exam,
    studyDaysPerWeek,
    topicsPerDay,
    filteredTopics
  );

  return {
    user_id: userId,
    preferences,
    plan: studyDays,
  };
}


function filterTopicsByExamSubject(topics: Topic[], examSubject: StudyPlanPreferences['examSubject']): Topic[] {
  if (examSubject === 'БЕЛ') return topics;
  return []; 
}

function filterTopicsByLevel(
  topics: Topic[],
  belLevel: KnowledgeLevel,
  literatureLevel: KnowledgeLevel,
  examSubject: StudyPlanPreferences['examSubject']
): Topic[] {
  const levelPriorityMap: Record<KnowledgeLevel, number> = {
    beginner: 4,
    intermediate: 6,
    advanced: 8,
  };

  const belMinPriority = levelPriorityMap[belLevel];
  const litMinPriority = levelPriorityMap[literatureLevel];
  const includeBel = examSubject === 'БЕЛ';
  const includeLit = examSubject === 'БЕЛ';

  return topics.filter(topic => {
    if (topic.subject === 'Български език') {
      return includeBel && topic.priority >= belMinPriority;
    }
    return includeLit && topic.priority >= litMinPriority;
  });
}

function getStudyDaysOfWeek(studyDaysPerWeek: number): number[] {
  if (studyDaysPerWeek === 7) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  // 5 days -> Monday-Friday (1,2,3,4,5)
  // 4 days -> Monday, Wednesday, Friday + one extra day
  // 3 days -> Monday, Wednesday, Friday
  // 2 days -> Tuesday, Thursday
  const presets: Record<number, number[]> = {
    5: [1, 2, 3, 4, 5],
    4: [1, 3, 5, 4],
    3: [1, 3, 5],
    2: [2, 4],
  };
  return presets[studyDaysPerWeek] ?? [1, 3, 5];
}

// number of study days
function countStudyDaysBetween(start: Date, end: Date, studyDaysOfWeek: number[]): number {
  let count = 0;
  const current = new Date(start);
  const endCopy = new Date(end);
  
  while (current <= endCopy) {
    if (studyDaysOfWeek.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// create a list of topics
function interleaveTopicsByPriority(belTopics: Topic[], litTopics: Topic[]): Topic[] {
  const result: Topic[] = [];
  let belIdx = 0;
  let litIdx = 0;
  let preferBel = belTopics.length >= litTopics.length;
  
  while (belIdx < belTopics.length || litIdx < litTopics.length) {
    if (preferBel && belIdx < belTopics.length) {
      result.push(belTopics[belIdx++]);
      preferBel = false;
    } else if (litIdx < litTopics.length) {
      result.push(litTopics[litIdx++]);
      preferBel = true;
    } else {
      result.push(belTopics[belIdx++]);
    }
  }
  return result;
}

function generateStudyDays(
  startDate: Date,
  endDate: Date,
  studyDaysPerWeek: number,
  topicsPerDay: number,
  topics: Topic[]
): StudyDay[] {
  const studyDaysOfWeek = getStudyDaysOfWeek(studyDaysPerWeek);
  const availableStudyDays = countStudyDaysBetween(startDate, endDate, studyDaysOfWeek);

  if (availableStudyDays === 0) {
    return [];
  }

  const belTopics = topics.filter(t => t.subject === 'Български език');
  const litTopics = topics.filter(t => t.subject === 'Литература');
  const allTopics = belTopics.length > 0 && litTopics.length > 0
    ? interleaveTopicsByPriority(belTopics, litTopics)
    : [...belTopics, ...litTopics];
  const totalTopics = allTopics.length;


  const basePerDay = Math.floor(totalTopics / availableStudyDays);
  const remainder = totalTopics % availableStudyDays;
  const dayCapacities: number[] = [];
  for (let i = 0; i < availableStudyDays; i++) {
    const ideal = basePerDay + (i < remainder ? 1 : 0);
    dayCapacities.push(Math.min(topicsPerDay, Math.max(1, ideal)));
  }

  const studyDays: StudyDay[] = [];
  const currentDate = new Date(startDate);
  let topicIndex = 0;
  let dayIndex = 0;

  while (currentDate <= endDate && dayIndex < availableStudyDays && topicIndex < totalTopics) {
    const dayOfWeek = currentDate.getDay();
    
    if (studyDaysOfWeek.includes(dayOfWeek)) {
      const capacity = dayCapacities[dayIndex] ?? topicsPerDay;
      const dayTopics: Topic[] = [];
      
      for (let i = 0; i < capacity && topicIndex < totalTopics; i++) {
        dayTopics.push(allTopics[topicIndex++]);
      }

      if (dayTopics.length > 0) {
        studyDays.push({
          date: formatDate(currentDate),
          topics: dayTopics,
          completed: false,
          missed: false,
        });
      }
      dayIndex++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return studyDays;
}


export type RescheduleMissedDayResult = {
  plan: StudyPlan;
  /** topics that could not fit before the exam within topics-per-day limits */
  unassignedCount: number;
};

function parseDateKey(dateKey: string): Date {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeExamDate(examDate: Date | string): Date {
  const exam = examDate instanceof Date ? new Date(examDate) : new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return exam;
}

/** all study-day dates in [start, end] per user's days-per-week preference */
function enumerateStudyDates(
  start: Date,
  end: Date,
  studyDaysPerWeek: number
): string[] {
  const studyDaysOfWeek = getStudyDaysOfWeek(studyDaysPerWeek);
  const dates: string[] = [];
  const current = new Date(start);
  const endCopy = new Date(end);
  endCopy.setHours(0, 0, 0, 0);

  while (current <= endCopy) {
    if (studyDaysOfWeek.includes(current.getDay())) {
      dates.push(formatDate(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function fillTopicsIntoDay(day: StudyDay, pool: Topic[], topicsPerDay: number): void {
  const room = topicsPerDay - day.topics.length;
  if (room <= 0) return;
  day.topics.push(...pool.splice(0, room));
}


export function rescheduleMissedDay(
  plan: StudyPlan,
  missedDate: string
): RescheduleMissedDayResult {
  const missedDayIndex = plan.plan.findIndex((day) => day.date === missedDate);
  if (missedDayIndex === -1) {
    return { plan, unassignedCount: 0 };
  }

  const missedDay = plan.plan[missedDayIndex];
  if (missedDay.missed || missedDay.completed) {
    return { plan, unassignedCount: 0 };
  }

  const { studyDaysPerWeek, topicsPerDay } = plan.preferences;
  const examDate = normalizeExamDate(plan.preferences.examDate);
  const topicPool: Topic[] = [...missedDay.topics];

  const existingByDate = new Map(plan.plan.map((d) => [d.date, { ...d, topics: [...d.topics] }]));

  for (const day of plan.plan) {
    if (day.date <= missedDate) continue;
    if (day.completed || day.missed) continue;
    topicPool.push(...day.topics);
    const entry = existingByDate.get(day.date);
    if (entry) entry.topics = [];
  }

  const redistributionStart = parseDateKey(missedDate);
  redistributionStart.setDate(redistributionStart.getDate() + 1);

  const slotDates = enumerateStudyDates(
    redistributionStart,
    examDate,
    studyDaysPerWeek
  );

  const prefix = plan.plan.slice(0, missedDayIndex).map((d) => ({
    ...d,
    topics: [...d.topics],
  }));

  const markedMissed: StudyDay = {
    ...missedDay,
    topics: [],
    missed: true,
    completed: false,
  };

  const futureDays: StudyDay[] = [];

  for (const date of slotDates) {
    const existing = existingByDate.get(date);
    if (existing?.completed) {
      futureDays.push({
        ...existing,
        topics: [...existing.topics],
      });
      continue;
    }
    if (existing?.missed) {
      futureDays.push({
        date,
        topics: [],
        completed: false,
        missed: true,
      });
      continue;
    }

    const dayTopics = topicPool.splice(0, topicsPerDay);
    futureDays.push({
      date,
      topics: dayTopics,
      completed: false,
      missed: false,
    });
  }

  // fill days that still have room 
  for (const day of futureDays) {
    if (day.completed || day.missed) continue;
    fillTopicsIntoDay(day, topicPool, topicsPerDay);
  }

  const unassignedCount = topicPool.length;

  return {
    plan: {
      ...plan,
      plan: [...prefix, markedMissed, ...futureDays],
    },
    unassignedCount,
  };
}


function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDaysUntilExam(examDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
