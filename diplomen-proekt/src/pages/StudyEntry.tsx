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
    <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-rose-50/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Изберете как да учите
        </h1>
        <p className="text-slate-600 mb-8">
          {step === 'subject'
            ? 'Изберете предмет, след което конкретна тема.'
            : 'Изберете тема за изучаване.'}
        </p>

        {step === 'subject' && (
          <div className="grid gap-4">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSubject(s.id)}
                className="w-full text-left px-6 py-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  {s.nameBg.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{s.nameBg}</p>
                  <p className="text-sm text-slate-500">{s.topics.length} теми</p>
                </div>
                <svg
                  className="w-5 h-5 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform"
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
          <div className="space-y-4">
            <button
              onClick={handleBackToSubject}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад към предмети
            </button>
            <p className="text-slate-600 mb-4">Предмет: <span className="font-semibold text-slate-900">{subject.nameBg}</span></p>
            <div className="grid gap-3">
              {subject.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopic(t.id)}
                  className="w-full text-left px-5 py-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm transition-all duration-200 flex items-center justify-between group"
                >
                  <span className="font-medium text-slate-800">{t.titleBg}</span>
                  <svg
                    className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform"
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
