import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subjects, getSubjectById } from '../data/curriculum';
import type { SubjectId, TopicId } from '../types/learning';

const pageShellStyle = {
  paddingTop: '2.5rem',
  paddingLeft: 'clamp(1.5rem, 8vw, 8rem)',
  paddingRight: '2rem',
  paddingBottom: '6rem',
} as const;

type StudyListItemProps = {
  title: string;
  subtitle?: string;
  onClick: () => void;
};

function StudyListItem({ title, subtitle, onClick }: StudyListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between text-left bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/40 transition-colors group"
      style={{ padding: '1.125rem 1.25rem', gap: '1rem' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-purple-700 group-hover:text-purple-800" style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.4 }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-slate-500" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      <span
        className="material-icons text-slate-300 group-hover:text-purple-700 transition-colors shrink-0"
        style={{ fontSize: '1.375rem' }}
      >
        chevron_right
      </span>
    </button>
  );
}

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
    <div className="min-h-full bg-slate-50 relative">
      <div
        className="pointer-events-none fixed top-0 right-0 -z-10 opacity-40"
        style={{ width: '33%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.05), transparent)' }}
      />

      <main className="max-w-4xl mx-auto" style={pageShellStyle}>
        {step === 'topic' && subject ? (
          <>
            <button
              type="button"
              onClick={handleBackToSubject}
              className="inline-flex items-center text-slate-500 hover:text-purple-700 transition-colors"
              style={{ gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.25rem' }}
            >
              <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_back</span>
              Назад към предмети
            </button>

            <h1
              className="text-slate-900"
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: '1.5rem',
              }}
            >
              Изберете как да <span className="text-purple-700">учите</span>
            </h1>

            <p
              className="text-slate-400 uppercase"
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '1rem',
              }}
            >
              {subject.nameBg}
            </p>

            <div className="flex flex-col" style={{ gap: '0.625rem' }}>
              {subject.topics.map((t) => (
                <StudyListItem key={t.id} title={t.titleBg} onClick={() => handleSelectTopic(t.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="inline-flex items-center text-slate-500 hover:text-purple-700 transition-colors"
              style={{ gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.25rem' }}
            >
              <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_back</span>
              Назад към начало
            </button>

            <h1
              className="text-slate-900"
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: '0.75rem',
              }}
            >
              Изберете как да <span className="text-purple-700">учите</span>
            </h1>

            <p className="text-slate-500" style={{ fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Изберете предмет, след което ще започнете с темите.
            </p>

            <p
              className="text-slate-400 uppercase"
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '1rem',
              }}
            >
              Предмети
            </p>

            <div className="flex flex-col" style={{ gap: '0.625rem' }}>
              {subjects.map((s) => (
                <StudyListItem
                  key={s.id}
                  title={s.nameBg}
                  subtitle={`${s.topics.length} ${s.topics.length === 1 ? 'тема' : 'теми'}`}
                  onClick={() => handleSelectSubject(s.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
