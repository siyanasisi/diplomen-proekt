import { useState, useEffect, useCallback } from 'react';
import { supabase, ensureValidSession } from '../supabase-client';
import type { StudyPlan as StudyPlanType } from '../lib/topics';
import { normalizeExamSubject, hasPlanContent } from '../lib/topics';
import { getCurriculumTopicIdsFromPlan } from '../lib/studyPlanMapping';

type KnowledgeLevel = import('../lib/topics').KnowledgeLevel;

export function useStudyPlan(userId: string | null) {
  const [studyPlans, setStudyPlans] = useState<StudyPlanType[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStudyPlans = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await ensureValidSession();
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading study plans:', error);
        return;
      }

      if (data && data.length > 0) {
        const transformed: StudyPlanType[] = data.map(
          (row: {
            id: string;
            user_id: string;
            preferences: {
              exam_subject?: string;
              exam_date: string;
              study_days_per_week: number;
              topics_per_day: number;
              bel_level: string;
              literature_level: string;
            };
            plan: StudyPlanType['plan'];
            created_at?: string;
            updated_at?: string;
          }) => ({
            id: row.id,
            user_id: row.user_id,
            preferences: {
              examSubject: normalizeExamSubject(row.preferences.exam_subject),
              examDate: new Date(row.preferences.exam_date),
              studyDaysPerWeek: row.preferences.study_days_per_week,
              topicsPerDay: row.preferences.topics_per_day,
              belLevel: row.preferences.bel_level as KnowledgeLevel,
              literatureLevel: row.preferences.literature_level as KnowledgeLevel,
            },
            plan: row.plan,
            created_at: row.created_at,
            updated_at: row.updated_at,
          })
        );
        setStudyPlans(transformed);
      } else {
        setStudyPlans([]);
      }
    } catch (error) {
      console.error('Error loading study plans:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStudyPlans();
  }, [loadStudyPlans]);

  const getTodayDateKey = useCallback(() => {
    const t = new Date();
    const year = t.getFullYear();
    const month = String(t.getMonth() + 1).padStart(2, '0');
    const day = String(t.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const studyPlan = studyPlans.find(
    (p) => p.id != null && hasPlanContent(p.preferences.examSubject)
  ) ?? studyPlans[0] ?? null;

  const getTodayStudyDay = useCallback(() => {
    if (!studyPlan) return null;
    const todayKey = getTodayDateKey();
    return studyPlan.plan.find((day) => day.date === todayKey) ?? null;
  }, [studyPlan, getTodayDateKey]);

  const getTodayPlanTopicIds = useCallback((): string[] => {
    const day = getTodayStudyDay();
    if (!day || day.topics.length === 0) return [];
    return getCurriculumTopicIdsFromPlan(day.topics);
  }, [getTodayStudyDay]);

  const getNextTopicFromPlan = useCallback(
    (currentTopicId: string): { subjectId: string; topicId: string } | null => {
      const topicIds = getTodayPlanTopicIds();
      const idx = topicIds.indexOf(currentTopicId);
      if (idx === -1 || idx >= topicIds.length - 1) return null;
      const nextTopicId = topicIds[idx + 1];
      const subjectId = nextTopicId.startsWith('bel-') ? 'bulgarian-language' : 'literature';
      return { subjectId, topicId: nextTopicId };
    },
    [getTodayPlanTopicIds]
  );

  const isLastTopicOfDay = useCallback(
    (topicId: string): boolean => {
      const topicIds = getTodayPlanTopicIds();
      if (topicIds.length === 0) return false;
      return topicIds[topicIds.length - 1] === topicId;
    },
    [getTodayPlanTopicIds]
  );

  const markDayCompleted = useCallback(
    async (date: string): Promise<boolean> => {
      if (!userId || !studyPlan) return false;
      try {
        await ensureValidSession();
        const updatedPlan = {
          ...studyPlan,
          plan: studyPlan.plan.map((d) =>
            d.date === date ? { ...d, completed: true, missed: false } : d
          ),
        };
        const { error } = await supabase
          .from('study_plans')
          .update({
            plan: updatedPlan.plan,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('id', studyPlan.id);

        if (error) {
          console.error('Error marking day completed:', error);
          return false;
        }
        setStudyPlans((prev) =>
          prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
        );
        return true;
      } catch (err) {
        console.error('Failed to mark day completed:', err);
        return false;
      }
    },
    [userId, studyPlan]
  );

  return {
    studyPlan,
    studyPlans,
    loading,
    getTodayStudyDay,
    getTodayPlanTopicIds,
    getNextTopicFromPlan,
    isLastTopicOfDay,
    markDayCompleted,
    getTodayDateKey,
    reload: loadStudyPlans,
  };
}
