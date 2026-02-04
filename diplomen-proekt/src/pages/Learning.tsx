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
  const [leftNavOpen, setLeftNavOpen] = useState(false);

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
    setLeftNavOpen(false);
    navigate(`/study/learn/${subId}/${topId}`, { replace: true });
  };

  if (!topic || !subject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-br from-slate-50 via-purple-50/30 to-purple-100/20">
        <p className="text-slate-500 font-medium">Зареждане...</p>
      </div>
    );
  }

  const TopicsNav = () => (
    <>
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Содержание
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Topics">
        {subjects.map((sub) => (
          <div key={sub.id} className="mb-6">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {sub.nameBg}
            </div>
            <ul className="space-y-0.5">
              {sub.topics.map((t) => {
                const isActive = t.id === topic.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => handleTopicClick(sub.id, t.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-lg shadow-purple-900/20'
                          : 'text-slate-600 hover:bg-purple-50/80 hover:text-slate-900'
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
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/30 to-purple-100/20 relative">
      {leftNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setLeftNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          w-[min(320px,85vw)] lg:w-72 flex-shrink-0
          bg-white/95 backdrop-blur-xl border-r-2 border-purple-200/50 flex flex-col overflow-hidden shadow-xl shadow-purple-900/10
          transform transition-transform duration-300 ease-out
          ${leftNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <TopicsNav />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b-2 border-purple-200/40">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <button
              type="button"
              onClick={() => setLeftNavOpen((o) => !o)}
              className="lg:hidden flex-shrink-0 p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Отвори съдържание"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Напредък в темата</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-900 to-purple-800 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
              {sections.length > 0 && (
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 -mx-1 scrollbar-none">
                  {sections.map((sec, idx) => (
                    <button
                      key={sec.id}
                      onClick={() => setCurrentSectionIndex(idx)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        idx === currentSectionIndex
                          ? 'bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-lg shadow-purple-900/20'
                          : 'bg-white/90 border border-slate-200 text-slate-600 hover:bg-purple-50/80 hover:border-purple-200/60'
                      }`}
                    >
                      {sec.titleBg}
                    </button>
                  ))}
                </div>
              )}

              {currentSection && (
                <>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-5 sm:mb-6 md:mb-8">
                    {currentSection.titleBg}
                  </h1>
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                    {currentSection.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <p key={i} className="font-semibold text-slate-900 mt-6 mb-1">
                            {line.slice(2, -2)}
                          </p>
                        );
                      }
                      return <p key={i} className="mb-3">{line}</p>;
                    })}
                  </div>
                </>
              )}

              <div className="mt-10 sm:mt-12 md:mt-14 pt-6 sm:pt-8 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
                {currentSectionIndex > 0 && (
                  <button
                    onClick={() => setCurrentSectionIndex((i) => i - 1)}
                    className="px-5 py-3 sm:py-3.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    Предишна секция
                  </button>
                )}
                {currentSectionIndex < sections.length - 1 && (
                  <button
                    onClick={() => setCurrentSectionIndex((i) => i + 1)}
                    className="px-5 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-900 to-purple-800 text-white font-medium hover:from-purple-800 hover:to-purple-700 shadow-lg shadow-purple-900/20 transition-colors min-h-[44px]"
                  >
                    Следваща секция
                  </button>
                )}
                {canContinue && (
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-900 to-purple-800 text-white font-semibold hover:from-purple-800 hover:to-purple-700 shadow-lg shadow-purple-900/30 hover:shadow-xl transition-all min-h-[44px]"
                  >
                    Продължи към тест
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden lg:block w-56 xl:w-60 flex-shrink-0 bg-white/80 backdrop-blur-sm border-l-2 border-purple-200/40 overflow-y-auto py-6 px-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Секции
            </span>
            <ul className="mt-3 space-y-1">
              {sections.map((sec, idx) => (
                <li key={sec.id}>
                  <button
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      idx === currentSectionIndex
                        ? 'bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-lg shadow-purple-900/20'
                        : 'text-slate-500 hover:bg-purple-50/80 hover:text-slate-800'
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
