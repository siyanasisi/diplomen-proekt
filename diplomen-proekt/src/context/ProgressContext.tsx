import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import type { TopicProgress, TopicId } from '../types/learning';
import { subjects, allTopics } from '../data/curriculum';

const STORAGE_KEY = 'matura-plus-learning-progress';

function loadProgress(userId: string | null): Record<TopicId, TopicProgress> {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TopicProgress>;
    return parsed as Record<TopicId, TopicProgress>;
  } catch {
    return {};
  }
}

function saveProgress(userId: string | null, data: Record<TopicId, TopicProgress>) {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(data));
  } catch {}
}

export interface ProgressContextType {
  // mark section as viewed
  markSectionViewed: (topicId: TopicId, sectionId: string) => void;
  // whether user has viewed the final section (can show Continue button)
  hasViewedFinalSection: (topicId: TopicId, finalSectionId: string) => boolean;
  recordTestSubmitted: (topicId: TopicId, score: number) => void;
  isTopicCompleted: (topicId: TopicId) => boolean;
  getTopicProgress: (topicId: TopicId) => TopicProgress | null;
  // get all completed topic ids 
  completedTopicIds: TopicId[];
  getNextTopicInSequence: (subjectId: string, currentTopicId: string) => { subjectId: string; topicId: string } | null;
  getRandomUncompletedTopic: () => { subjectId: string; topicId: string } | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [progressByTopic, setProgressByTopic] = useState<Record<TopicId, TopicProgress>>(() =>
    loadProgress(userId)
  );

  useEffect(() => {
    setProgressByTopic(loadProgress(userId));
  }, [userId]);

  const markSectionViewed = useCallback(
    (topicId: TopicId, sectionId: string) => {
      const now = new Date().toISOString();
      setProgressByTopic((prev) => {
        const cur = prev[topicId];
        const viewed = cur?.viewedSectionIds ?? [];
        if (viewed.includes(sectionId)) return prev;
        const nextViewed = [...viewed, sectionId].sort();
        const next: Record<TopicId, TopicProgress> = {
          ...prev,
          [topicId]: {
            topicId,
            viewedSectionIds: nextViewed,
            lastViewedAt: now,
            testSubmittedAt: cur?.testSubmittedAt ?? null,
            testScore: cur?.testScore ?? null,
          },
        };
        saveProgress(userId, next);
        return next;
      });
    },
    [userId]
  );

  const hasViewedFinalSection = useCallback(
    (topicId: TopicId, finalSectionId: string) => {
      const p = progressByTopic[topicId];
      return p?.viewedSectionIds?.includes(finalSectionId) ?? false;
    },
    [progressByTopic]
  );

  const recordTestSubmitted = useCallback(
    (topicId: TopicId, score: number) => {
      const now = new Date().toISOString();
      setProgressByTopic((prev) => {
        const next: Record<TopicId, TopicProgress> = {
          ...prev,
          [topicId]: {
            ...prev[topicId],
            topicId,
            viewedSectionIds: prev[topicId]?.viewedSectionIds ?? [],
            lastViewedAt: prev[topicId]?.lastViewedAt ?? now,
            testSubmittedAt: now,
            testScore: score,
          },
        };
        saveProgress(userId, next);
        return next;
      });
    },
    [userId]
  );

  const isTopicCompleted = useCallback(
    (topicId: TopicId) => {
      const p = progressByTopic[topicId];
      return (p?.testSubmittedAt != null && p?.viewedSectionIds?.length > 0) ?? false;
    },
    [progressByTopic]
  );

  const getTopicProgress = useCallback(
    (topicId: TopicId) => progressByTopic[topicId] ?? null,
    [progressByTopic]
  );

  const completedTopicIds = useMemo(
    () => Object.values(progressByTopic).filter((p) => p.testSubmittedAt != null).map((p) => p.topicId),
    [progressByTopic]
  );

  const getNextTopicInSequence = useCallback(
    (subjectId: string, currentTopicId: string) => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject?.topics?.length) return null;
      const idx = subject.topics.findIndex((t) => t.id === currentTopicId);
      if (idx === -1 || idx >= subject.topics.length - 1) return null;
      const next = subject.topics[idx + 1];
      return { subjectId, topicId: next.id };
    },
    []
  );

  const getRandomUncompletedTopic = useCallback(() => {
    const completed = new Set(
      Object.values(progressByTopic).filter((p) => p.testSubmittedAt != null).map((p) => p.topicId)
    );
    const uncompleted = allTopics.filter((t) => !completed.has(t.id as TopicId));
    if (uncompleted.length === 0) return null;
    const chosen = uncompleted[Math.floor(Math.random() * uncompleted.length)];
    return { subjectId: chosen.subjectId, topicId: chosen.id };
  }, [progressByTopic]);

  const value = useMemo<ProgressContextType>(
    () => ({
      markSectionViewed,
      hasViewedFinalSection,
      recordTestSubmitted,
      isTopicCompleted,
      getTopicProgress,
      completedTopicIds,
      getNextTopicInSequence,
      getRandomUncompletedTopic,
    }),
    [
      markSectionViewed,
      hasViewedFinalSection,
      recordTestSubmitted,
      isTopicCompleted,
      getTopicProgress,
      completedTopicIds,
      getNextTopicInSequence,
      getRandomUncompletedTopic,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextType {
  const ctx = useContext(ProgressContext);
  if (ctx === undefined) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
