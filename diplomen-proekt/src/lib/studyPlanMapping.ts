import type { Topic } from './topics';

export function mapStudyPlanTopicToCurriculum(planTopic: Topic): { subjectId: string; topicId: string } {
  if (planTopic.subject === 'Български език') {
    return {
      subjectId: 'bulgarian-language',
      topicId: `bel-${planTopic.id}`,
    };
  }
  return {
    subjectId: 'literature',
    topicId: `lit-${planTopic.id}`,
  };
}

export function getCurriculumTopicIdsFromPlan(planTopics: Topic[]): string[] {
  return planTopics.map((t) => mapStudyPlanTopicToCurriculum(t).topicId);
}
