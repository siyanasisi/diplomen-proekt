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

  if (step === 'topic' && subject) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white">
        <header className="max-w-4xl pt-12 pb-6" style={{ marginLeft: '8rem', marginRight: '4rem' }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Изберете как да <span className="text-purple-700">учите</span>
          </h1>
          <button
            onClick={handleBackToSubject}
            className="inline-flex items-center text-slate-500 hover:text-purple-700 transition-colors gap-2 font-medium"
          >
            <span className="material-icons text-xl">arrow_back</span>
            Назад към предмети
          </button>
        </header>

        <main className="max-w-4xl pb-20" style={{ marginLeft: '8rem', marginRight: '4rem' }}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-400 uppercase tracking-wider">
              {subject.nameBg}
            </h2>
          </div>

          <div className="grid gap-6">
            {subject.topics.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t.id)}
                className="flex items-center justify-between py-8 px-8 bg-white border-2 border-slate-200 rounded-3xl hover:border-purple-600 hover:shadow-lg hover:shadow-purple-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left w-full group"
              >
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-purple-700">{t.titleBg}</span>
                </div>
                <span className="material-icons text-2xl text-slate-400 group-hover:text-purple-700 transition-colors">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50/40 via-pink-50/30 to-purple-100/40 flex flex-col py-12 relative overflow-auto">
      {/* subtle background */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-300/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-pink-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex-1 flex flex-col" style={{ marginLeft: '8rem', marginRight: '4rem' }}>
        {/* header */}
        <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Изберете как да <span className="text-purple-700">учите</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Изберете предмет, след което ще започнете теми.
          </p>
        </div>

        {/* subject cards */}
        <div className="grid gap-6">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSubject(s.id)}
              className="w-full text-left group rounded-3xl bg-white/95 backdrop-blur-sm py-8 px-8 border-2 border-slate-200 shadow-sm hover:shadow-lg hover:shadow-purple-600/10 hover:border-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-6"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {s.nameBg.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-purple-700 text-xl">{s.nameBg}</p>
                <p className="text-slate-500 text-base mt-1">{s.topics.length} теми</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
