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


export function rescheduleMissedDay(
  plan: StudyPlan,
  missedDate: string
): StudyPlan {
  const updatedPlan = { ...plan };
  const missedDayIndex = updatedPlan.plan.findIndex(day => day.date === missedDate);

  if (missedDayIndex === -1) return plan;

  const missedDay = updatedPlan.plan[missedDayIndex];
  
  if (missedDay.missed || missedDay.completed) return plan;
  if (missedDay.topics.length === 0) {
    missedDay.missed = true;
    return updatedPlan;
  }

  missedDay.missed = true;
  const missedTopics = [...missedDay.topics];

  const availableDays: number[] = [];
  for (let i = missedDayIndex + 1; i < updatedPlan.plan.length; i++) {
    const day = updatedPlan.plan[i];
    if (!day.missed && !day.completed) {
      availableDays.push(i);
    }
  }

  if (availableDays.length === 0) {
    missedDay.topics = [];
    return updatedPlan;
  }

  // collect all topics (missed + from subsequent days)
  const allTopics: Topic[] = [...missedTopics];
  for (const dayIndex of availableDays) {
    allTopics.push(...updatedPlan.plan[dayIndex].topics);
    updatedPlan.plan[dayIndex].topics = [];
  }

  // distribute topics sequentially across all subsequent days
  const limit = updatedPlan.preferences.topicsPerDay;
  let topicIdx = 0;
  
  for (let i = 0; i < availableDays.length && topicIdx < allTopics.length; i++) {
    const dayIndex = availableDays[i];
    const day = updatedPlan.plan[dayIndex];
    const topicsToAdd = Math.min(limit, allTopics.length - topicIdx);
    if (topicsToAdd > 0) {
      day.topics = allTopics.slice(topicIdx, topicIdx + topicsToAdd);
      topicIdx += topicsToAdd;
    }
  }
  
  // distribute remainder evenly
  if (topicIdx < allTopics.length) {
    let dayCounter = 0;
    while (topicIdx < allTopics.length) {
      const dayIndex = availableDays[dayCounter % availableDays.length];
      const day = updatedPlan.plan[dayIndex];
      day.topics.push(allTopics[topicIdx]);
      topicIdx++;
      dayCounter++;
    }
  }
  

  missedDay.topics = [];
  return updatedPlan;
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
