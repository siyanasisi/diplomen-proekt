import type { KnowledgeLevel, StudyPlanPreferences, StudyDay, StudyPlan, Topic } from './topics';
import { ALL_TOPICS } from './topics';

export function generateStudyPlan(
  preferences: StudyPlanPreferences,
  userId: string
): StudyPlan {
  const { examDate, studyDaysPerWeek, topicsPerDay, belLevel, literatureLevel } = preferences;

  //days until exam
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  
  const daysUntilExam = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExam <= 0) {
    throw new Error('Датата на изпита трябва да бъде в бъдещето');
  }


  const filteredTopics = filterTopicsByLevel(ALL_TOPICS, belLevel, literatureLevel);

  // generate study days
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


 // filters topics based on knowledge levels

function filterTopicsByLevel(
  topics: Topic[],
  belLevel: KnowledgeLevel,
  literatureLevel: KnowledgeLevel
): Topic[] {
  const levelPriorityMap: Record<KnowledgeLevel, number> = {
    beginner: 4,     
    intermediate: 6, 
    advanced: 8,     
  };

  const belMinPriority = levelPriorityMap[belLevel];
  const litMinPriority = levelPriorityMap[literatureLevel];

  return topics.filter(topic => {
    if (topic.subject === 'Български език') {
      return topic.priority >= belMinPriority;
    } else {
      return topic.priority >= litMinPriority;
    }
  });
}


// generates study days with assigned topics
 
function generateStudyDays(
  startDate: Date,
  endDate: Date,
  studyDaysPerWeek: number,
  topicsPerDay: number,
  topics: Topic[]
): StudyDay[] {
  const studyDays: StudyDay[] = [];
  const currentDate = new Date(startDate);

  const belTopics = topics.filter(t => t.subject === 'Български език');
  const litTopics = topics.filter(t => t.subject === 'Литература');
  
  let belIndex = 0;
  let litIndex = 0;

  const studyDaysOfWeek: number[] = [];
  if (studyDaysPerWeek === 7) {
    for (let i = 0; i < 7; i++) studyDaysOfWeek.push(i);
  } else {
    // distribute study days evenly across the week
    // Use better distribution algorithm
    const spacing = Math.floor(7 / studyDaysPerWeek);
    const remainder = 7 % studyDaysPerWeek;
    let currentDay = 0;
    
    for (let i = 0; i < studyDaysPerWeek; i++) {
      studyDaysOfWeek.push(currentDay);
      currentDay += spacing;
      if (i < remainder) currentDay += 1;
      if (currentDay >= 7) currentDay -= 7;
    }
    
    // Sort to ensure proper order
    studyDaysOfWeek.sort((a, b) => a - b);
  }

  while (currentDate <= endDate && (belIndex < belTopics.length || litIndex < litTopics.length)) {
    const dayOfWeek = currentDate.getDay();
    
    // check if this day is a study day
    if (studyDaysOfWeek.includes(dayOfWeek)) {
      const dayTopics: Topic[] = [];
      
      // assign topics for this day 
      for (let i = 0; i < topicsPerDay && (belIndex < belTopics.length || litIndex < litTopics.length); i++) {
        const preferBel = i % 2 === 0 || litIndex >= litTopics.length;
        
        if (preferBel && belIndex < belTopics.length) {
          dayTopics.push(belTopics[belIndex]);
          belIndex++;
        } else if (litIndex < litTopics.length) {
          dayTopics.push(litTopics[litIndex]);
          litIndex++;
        } else if (belIndex < belTopics.length) {
          dayTopics.push(belTopics[belIndex]);
          belIndex++;
        } else {
          break; 
        }
      }

      if (dayTopics.length > 0) {
        studyDays.push({
          date: formatDate(currentDate),
          topics: dayTopics,
          completed: false,
          missed: false,
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return studyDays;
}


 // reschedule topic when missed
 
export function rescheduleMissedDay(
  plan: StudyPlan,
  missedDate: string
): StudyPlan {
  const updatedPlan = { ...plan };
  const missedDayIndex = updatedPlan.plan.findIndex(day => day.date === missedDate);

  if (missedDayIndex === -1) return plan;

  updatedPlan.plan[missedDayIndex].missed = true;
  const missedTopics = [...updatedPlan.plan[missedDayIndex].topics];

  let topicIndex = 0;
  for (let i = missedDayIndex + 1; i < updatedPlan.plan.length && topicIndex < missedTopics.length; i++) {
    const day = updatedPlan.plan[i];
    
    if (day.missed || day.completed) continue;

    const remainingCapacity = updatedPlan.preferences.topicsPerDay - day.topics.length;
    if (remainingCapacity > 0) {
      const topicsToAdd = missedTopics.slice(topicIndex, topicIndex + remainingCapacity);
      day.topics.push(...topicsToAdd);
      topicIndex += topicsToAdd.length;
    }
  }

  // if there are still topics left add them to the end
  if (topicIndex < missedTopics.length) {
    const remainingTopics = missedTopics.slice(topicIndex);
    // find the last day and add remaining topics
    for (let i = updatedPlan.plan.length - 1; i >= 0; i--) {
      const day = updatedPlan.plan[i];
      if (!day.missed && !day.completed) {
        const remainingCapacity = updatedPlan.preferences.topicsPerDay - day.topics.length;
        if (remainingCapacity > 0) {
          const topicsToAdd = remainingTopics.slice(0, remainingCapacity);
          day.topics.push(...topicsToAdd);
        }
        break;
      }
    }
  }

  updatedPlan.plan[missedDayIndex].topics = []; 

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
