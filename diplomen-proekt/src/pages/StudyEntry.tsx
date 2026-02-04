import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subjects, getSubjectById } from '../data/curriculum';
import type { SubjectId, TopicId } from '../types/learning';

export function StudyEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId | null>(null);
  const [step, setStep] = useState<'subject' | 'topic'>('subject');

  const handleSelectSubject = (subjectId: SubjectId) => {
    setSelectedSubjectId(subjectId);
    setStep('topic');
  };

  const handleSelectTopic = (topicId: TopicId) => {
    if (!selectedSubjectId) return;
    navigate(`/study/learn/${selectedSubjectId}/${topicId}`);
  };

  const handleBackToSubject = () => {
    setSelectedSubjectId(null);
    setStep('subject');
  };

  if (!user) return null;

  const subject = selectedSubjectId ? getSubjectById(selectedSubjectId) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/30 to-purple-100/20 flex items-start justify-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-auto">
      {/* subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-200/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl sm:max-w-2xl relative z-10">
        <div className="mb-10 sm:mb-14 md:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 sm:mb-4">
            Изберете как да <span className="text-purple-700">учите</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl">
            {step === 'subject'
              ? 'Изберете предмет, след което конкретна тема.'
              : 'Изберете тема за изучаване.'}
          </p>
        </div>

        {step === 'subject' && (
          <div className="space-y-4 sm:space-y-5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSubject(s.id)}
                className="w-full text-left group rounded-2xl bg-white/90 backdrop-blur-sm p-5 sm:p-6 md:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-purple-900/10 hover:border-purple-200/60 active:scale-[0.99] transition-all duration-300 flex items-center gap-4 sm:gap-5 min-h-[4.5rem] sm:min-h-0"
              >
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg shadow-purple-900/30 group-hover:shadow-xl group-hover:scale-105 transition-all">
                  {s.nameBg.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-base sm:text-lg">{s.nameBg}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{s.topics.length} теми</p>
                </div>
                <svg
                  className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {step === 'topic' && subject && (
          <div className="space-y-6 sm:space-y-8">
            <button
              onClick={handleBackToSubject}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors py-2 -ml-1 min-h-[44px] min-w-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад към предмети
            </button>
            <p className="text-slate-500 text-base sm:text-lg">
              Предмет: <span className="font-semibold text-slate-900">{subject.nameBg}</span>
            </p>
            <div className="space-y-3 sm:space-y-4">
              {subject.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopic(t.id)}
                  className="w-full text-left rounded-2xl bg-white/90 backdrop-blur-sm px-5 py-4 sm:px-6 sm:py-5 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-purple-900/10 hover:border-purple-200/60 active:scale-[0.99] transition-all duration-300 flex items-center justify-between group min-h-[3.5rem] sm:min-h-0"
                >
                  <span className="font-medium text-slate-800 text-base sm:text-lg">{t.titleBg}</span>
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
