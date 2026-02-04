export type SubjectId = string;
export type TopicId = string;

export interface Subject {
  id: SubjectId;
  name: string;
  nameBg: string;
  topics: Topic[];
}

export interface TopicSection {
  id: string;
  title: string;
  titleBg: string;
  content: string;
  order: number;
}

export interface Topic {
  id: TopicId;
  subjectId: SubjectId;
  title: string;
  titleBg: string;
  sections: TopicSection[];
  finalSectionId: string;
}

export interface TestQuestion {
  id: string;
  topicId: TopicId;
  question: string;
  questionBg: string;
  options: { id: string; text: string; textBg: string; isCorrect: boolean }[];
  order: number;
}

export interface TopicTest {
  topicId: TopicId;
  questions: TestQuestion[];
}

// progress 
export interface TopicProgress {
  topicId: TopicId;
  viewedSectionIds: string[];
  lastViewedAt: string;
  testSubmittedAt: string | null;
  testScore: number | null;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  topicIdsCompleted: TopicId[];
}
