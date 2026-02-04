import type { Subject, Topic, TopicTest } from '../types/learning';

const literatureTopics: Topic[] = [
  {
    id: 'lit-test1',
    subjectId: 'literature',
    title: 'Test 1',
    titleBg: 'Test1 - first test',
    finalSectionId: 'analysis',
    sections: [
      {
        id: 'text',
        title: 'Test',
        titleBg: 'text of the test',
        order: 1,
        content: `testcontent test test test`,
      },
      {
        id: 'analysis',
        title: 'Analysis of the work',
        titleBg: 'analysis of the test',
        order: 2,
        content: `analysis of the test analysis of the test analysis of the test`,
      },
    ],
  },
  {
    id: 'lit-test2',
    subjectId: 'literature',
    title: 'test2 - second test',
    titleBg: 'test2 - second test',
    finalSectionId: 'analysis',
    sections: [
      {
        id: 'text',
        title: 'test2 - text of the test',
        titleBg: 'test2 - text of the test',
        order: 1,
        content: `test2 content test2 content test2 content`,
      },
      {
        id: 'analysis',
        title: 'Analysis of the work',
        titleBg: 'test2 - analysis of the test',
        order: 2,
        content: `test2 analysis test2 analysis test2 analysis`,
      },
    ],
  },
  {
    id: 'lit-test3',
    subjectId: 'literature',
    title: 'test3 - third test',
    titleBg: 'test3 - third test',
    finalSectionId: 'analysis',
    sections: [
      {
        id: 'text',
        title: 'test3 - text of the test',
        titleBg: 'Текст на произведението',
        order: 1,
        content: `test3 content test3 content test3 content`,
      },
      {
        id: 'analysis',
        title: 'Analysis of the work',
        titleBg: 'test3 - analysis of the test',
        order: 2,
        content: `**test3 analysis** `,
      },
    ],
  },
];


const languageTopics: Topic[] = [
  {
    id: 'lang-test1',
    subjectId: 'bulgarian-language',
    title: 'test1 - first test',
    titleBg: 'test1 - first test',
    finalSectionId: 'summary',
    sections: [
      {
        id: 'theory',
        title: 'Theory',
        titleBg: 'test1 - theory',
        order: 1,
        content: `test1 content test1 content test1 content`,
      },
      {
        id: 'summary',
        title: 'Summary',
        titleBg: 'test1 - summary',
        order: 2,
        content: `test1 summary test1 summary test1 summary`,
      },
    ],
  },
  {
    id: 'lang-test2',
    subjectId: 'bulgarian-language',
    title: 'test2 - second test',
    titleBg: 'test2 - second test',
    finalSectionId: 'summary',
    sections: [
      {
        id: 'theory',
        title: 'Theory',
        titleBg: 'test2 - theory',
        order: 1,
        content: `test2 content test2 content test2 content`,
      },
      {
        id: 'summary',
        title: 'Summary',
        titleBg: 'test2 - summary',
        order: 2,
        content: `test2 summary test2 summary test2 summary`,
      },
    ],
  },
];

export const subjects: Subject[] = [
  {
    id: 'literature',
    name: 'Literature',
    nameBg: 'Литература',
    topics: literatureTopics,
  },
  {
    id: 'bulgarian-language',
    name: 'Bulgarian Language',
    nameBg: 'Български език',
    topics: languageTopics,
  },
];

// all topics flat for lookups
export const allTopics = subjects.flatMap((s) => s.topics);

export function getTopicById(topicId: string): Topic | undefined {
  return allTopics.find((t) => t.id === topicId);
}

export function getSubjectById(subjectId: string): Subject | undefined {
  return subjects.find((s) => s.id === subjectId);
}

const testsByTopic: Record<string, TopicTest> = {
  'lit-test1': {
    topicId: 'lit-test1',
    questions: [
      {
        id: 'q1',
        topicId: 'lit-test1',
        question: 'Question 1 - Test 1?',
        questionBg: 'Въпрос 1 - Test 1?',
        order: 1,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        topicId: 'lit-test1',
        question: 'Question 2 - Test 1?',
        questionBg: 'Въпрос 2 - Test 1?',
        order: 2,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        topicId: 'lit-test1',
        question: 'Question 3 - Test 1?',
        questionBg: 'Въпрос 3 - Test 1?',
        order: 3,
        options: [
          { id: 'a', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
    ],
  },
  'lit-test2': {
    topicId: 'lit-test2',
    questions: [
      {
        id: 'q1',
        topicId: 'lit-test2',
        question: 'Question 1 - Test 2?',
        questionBg: 'Въпрос 1 - Test 2?',
        order: 1,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        topicId: 'lit-test2',
        question: 'Question 2 - Test 2?',
        questionBg: 'Въпрос 2 - Test 2?',
        order: 2,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
    ],
  },
  'lit-test3': {
    topicId: 'lit-test3',
    questions: [
      {
        id: 'q1',
        topicId: 'lit-test3',
        question: 'Question 1 - Test 3?',
        questionBg: 'Въпрос 1 - Test 3?',
        order: 1,
        options: [
          { id: 'a', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        topicId: 'lit-test3',
        question: 'Question 2 - Test 3?',
        questionBg: 'Въпрос 2 - Test 3?',
        order: 2,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
    ],
  },
  'lang-test1': {
    topicId: 'lang-test1',
    questions: [
      {
        id: 'q1',
        topicId: 'lang-test1',
        question: 'Question 1 - Lang Test 1?',
        questionBg: 'Въпрос 1 - Lang Test 1?',
        order: 1,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        topicId: 'lang-test1',
        question: 'Question 2 - Lang Test 1?',
        questionBg: 'Въпрос 2 - Lang Test 1?',
        order: 2,
        options: [
          { id: 'a', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
    ],
  },
  'lang-test2': {
    topicId: 'lang-test2',
    questions: [
      {
        id: 'q1',
        topicId: 'lang-test2',
        question: 'Question 1 - Lang Test 2?',
        questionBg: 'Въпрос 1 - Lang Test 2?',
        order: 1,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Correct', textBg: 'Вярно', isCorrect: true },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        topicId: 'lang-test2',
        question: 'Question 2 - Lang Test 2?',
        questionBg: 'Въпрос 2 - Lang Test 2?',
        order: 2,
        options: [
          { id: 'a', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'b', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'c', text: 'Wrong', textBg: 'Грешно', isCorrect: false },
          { id: 'd', text: 'Correct', textBg: 'Вярно', isCorrect: true },
        ],
      },
    ],
  },
};

export function getTestForTopic(topicId: string): TopicTest | undefined {
  return testsByTopic[topicId];
}
