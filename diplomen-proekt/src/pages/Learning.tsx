import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { subjects, getTopicById, getSubjectById } from '../data/curriculum';

export function Learning() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markSectionViewed, hasViewedFinalSection, getTopicProgress } = useProgress();

  const topic = useMemo(() => (topicId ? getTopicById(topicId) : null), [topicId]);
  const subject = useMemo(() => (subjectId ? getSubjectById(subjectId) : null), [subjectId]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!topicId || !topic) {
      navigate('/study', { replace: true });
      return;
    }
    if (!subjectId || !subject) {
      navigate('/study', { replace: true });
      return;
    }
  }, [user, topicId, topic, subjectId, subject, navigate]);

  const sections = topic?.sections ?? [];
  const currentSection = sections[currentSectionIndex] ?? null;
  const progress = topic ? getTopicProgress(topic.id) : null;
  const viewedCount = progress?.viewedSectionIds?.length ?? 0;
  const progressPercent = sections.length > 0 ? Math.round((viewedCount / sections.length) * 100) : 0;
  const canContinue =
    topic != null &&
    hasViewedFinalSection(topic.id, topic.finalSectionId);

  useEffect(() => {
    if (currentSection && topic) {
      markSectionViewed(topic.id, currentSection.id);
    }
  }, [topic?.id, currentSection?.id, markSectionViewed]);

  const handleContinue = () => {
    if (!topicId) return;
    navigate(`/study/test/${topicId}`, { state: { subjectId, topicId } });
  };

  const handleTopicClick = (subId: string, topId: string) => {
    navigate(`/study/learn/${subId}/${topId}`, { replace: true });
  };

  if (!topic || !subject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Зареждане...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50/80">
      {/* left sidebar - all topics by subject */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Содержание</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Topics">
          {subjects.map((sub) => (
            <div key={sub.id} className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {sub.nameBg}
              </div>
              <ul className="space-y-0.5">
                {sub.topics.map((t) => {
                  const isActive = t.id === topic.id;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => handleTopicClick(sub.id, t.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-r-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {t.titleBg}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* progress bar */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-sm font-medium text-slate-600">Напредък в темата</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {currentSection && (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 mb-4">{currentSection.titleBg}</h1>
                  <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
                    {currentSection.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <p key={i} className="font-semibold text-slate-900 mt-4 mb-1">
                            {line.slice(2, -2)}
                          </p>
                        );
                      }
                      return <p key={i} className="mb-2">{line}</p>;
                    })}
                  </div>
                </>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {currentSectionIndex > 0 && (
                  <button
                    onClick={() => setCurrentSectionIndex((i) => i - 1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Предишна секция
                  </button>
                )}
                {currentSectionIndex < sections.length - 1 && (
                  <button
                    onClick={() => setCurrentSectionIndex((i) => i + 1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                  >
                    Следваща секция
                  </button>
                )}
                {canContinue && (
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/30"
                  >
                    Продължи към тест
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* right sidebar - sections of current topic */}
          <aside className="w-56 flex-shrink-0 bg-white/80 border-l border-slate-200 overflow-y-auto py-4 px-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Секции
            </div>
            <ul className="space-y-1">
              {sections.map((sec, idx) => (
                <li key={sec.id}>
                  <button
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      idx === currentSectionIndex
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sec.titleBg}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
