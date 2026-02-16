import { useEffect, useMemo, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { subjects, getTopicById, getSubjectById } from '../data/curriculum';

const SECTION_ICON_MAP: Record<string, string> = {
  theory: 'menu_book',
  themes: 'psychology',
  heroes: 'person_outline',
  characters: 'person_outline',
  test: 'quiz',
  summary: 'menu_book',
  overview: 'menu_book',
};

function getSectionIcon(sectionId: string, sectionTitle: string): string {
  const lower = sectionId.toLowerCase();
  if (SECTION_ICON_MAP[lower]) return SECTION_ICON_MAP[lower];
  const t = sectionTitle.toLowerCase();
  if (t.includes('тем') || t.includes('символ') || t.includes('послани')) return 'psychology';
  if (t.includes('геро') || t.includes('персонаж') || t.includes('образ')) return 'person_outline';
  if (t.includes('тест') || t.includes('упражнени')) return 'quiz';
  return 'menu_book';
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-purple-800 font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Learning() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markSectionViewed, hasViewedFinalSection, getTopicProgress } = useProgress();

  const topic = useMemo(() => (topicId ? getTopicById(topicId) : null), [topicId]);
  const subject = useMemo(() => (subjectId ? getSubjectById(subjectId) : null), [subjectId]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!topicId || !topic) { navigate('/study', { replace: true }); return; }
    if (!subjectId || !subject) { navigate('/study', { replace: true }); return; }
  }, [user, topicId, topic, subjectId, subject, navigate]);

  const sections = topic?.sections ?? [];
  const currentSection = sections[currentSectionIndex] ?? null;
  const progress = topic ? getTopicProgress(topic.id) : null;
  const viewedCount = progress?.viewedSectionIds?.length ?? 0;
  const progressPercent =
    sections.length > 0 ? Math.round((viewedCount / sections.length) * 100) : 0;
  const canContinue =
    topic != null && hasViewedFinalSection(topic.id, topic.finalSectionId);

  useEffect(() => {
    if (currentSection && topic) markSectionViewed(topic.id, currentSection.id);
  }, [topic?.id, currentSection?.id, markSectionViewed]);

  const handleContinue = () => {
    if (!topicId) return;
    navigate(`/study/test/${topicId}`, { state: { subjectId, topicId } });
  };
  const handleTopicClick = (subId: string, topId: string) => {
    navigate(`/study/learn/${subId}/${topId}`, { replace: true });
    setSidebarOpen(false);
  };

  if (!topic || !subject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <p className="text-slate-500 font-medium text-lg">Зареждане...</p>
      </div>
    );
  }


  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const out: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') { i++; continue; }

      if (line.startsWith('> ')) {
        const box: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          box.push(lines[i].replace(/^>\s*/, ''));
          i++;
        }
        const joined = box.join(' ');

        if (joined.includes('•')) {
          const [rawLabel, ...chipParts] = joined.split('•');
          const label = rawLabel.replace(/\*\*/g, '').trim();
          const chips = chipParts.map((c) => c.trim().replace(/\.$/, '')).filter(Boolean);
          out.push(
            <div key={`chips-${i}`} style={{ marginTop: '2rem' }}>
              {label && (
                <p className="text-sm font-semibold text-purple-800" style={{ marginBottom: '0.75rem' }}>{label}</p>
              )}
              <div className="flex flex-wrap" style={{ gap: '0.625rem' }}>
                {chips.map((chip, ci) => (
                  <span
                    key={ci}
                    className="rounded-full bg-purple-50 text-purple-800 text-sm font-medium border border-purple-100"
                    style={{ padding: '0.375rem 1rem' }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>,
          );
        } else {
          out.push(
            <div
              key={`box-${i}`}
              className="bg-purple-50/70 border border-purple-100"
              style={{ padding: '1.25rem', borderRadius: '1rem' }}
            >
              <p className="text-slate-700 leading-relaxed" style={{ margin: 0 }}>
                {box.map((bl, bi) => (
                  <Fragment key={bi}>
                    {bi > 0 && <br />}
                    {renderInlineMarkdown(bl)}
                  </Fragment>
                ))}
              </p>
            </div>,
          );
        }
        continue;
      }

      if (line.startsWith('## ')) {
        out.push(
          <h3 key={`h-${i}`} className="text-lg font-bold text-slate-900" style={{ marginTop: '2rem', marginBottom: '0.25rem' }}>
            {line.replace(/^##\s*/, '')}
          </h3>,
        );
        i++; continue;
      }

      if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
        out.push(
          <p key={`b-${i}`} className="font-semibold text-slate-900" style={{ marginTop: '1.25rem' }}>
            {line.slice(2, -2)}
          </p>,
        );
        i++; continue;
      }

      if (line.startsWith('- ')) {
        out.push(
          <div key={`li-${i}`} className="flex items-start" style={{ gap: '0.75rem' }}>
            <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.25rem', marginTop: '0.125rem' }}>
              check_circle_outline
            </span>
            <span className="text-slate-700 leading-relaxed">
              {renderInlineMarkdown(line.replace(/^-\s*/, ''))}
            </span>
          </div>,
        );
        i++; continue;
      }

      if (/^\d+\)\s/.test(line)) {
        out.push(
          <p key={`n-${i}`} className="text-slate-800 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>,
        );
        i++; continue;
      }

      out.push(
        <p key={`p-${i}`} className="text-slate-700 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>,
      );
      i++;
    }

    return out;
  };

  const topicList = (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {subject.topics.map((t) => {
        const isActive = t.id === topic.id;
        return (
          <li key={t.id} style={{ listStyle: 'none' }}>
            <button
              onClick={() => handleTopicClick(subject.id, t.id)}
              title={t.titleBg}
              className={`flex items-center w-full text-left transition-all duration-200 ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                fontSize: '0.925rem',
                lineHeight: '1.4',
                gap: '0.75rem',
              }}
            >
              <span className="line-clamp-2">{t.titleBg}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-full bg-slate-50">
      {/* mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* mobile sidebar drawer */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-50 bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-out lg:hidden`}
        style={{
          width: '20rem',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="h-full overflow-auto" style={{ padding: '1.5rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
            <p className="font-bold text-slate-800" style={{ fontSize: '1.05rem' }}>Съдържание</p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-slate-100 transition-colors"
              style={{ padding: '0.375rem', borderRadius: '0.625rem' }}
              aria-label="Затвори"
            >
              <span className="material-icons text-slate-400" style={{ fontSize: '1.25rem' }}>close</span>
            </button>
          </div>
          <p className="text-slate-500" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>{subject.nameBg}</p>
          <div className="flex items-center" style={{ gap: '0.625rem', marginBottom: '1.5rem' }}>
            <div className="flex-1 bg-slate-100 overflow-hidden" style={{ height: '0.625rem', borderRadius: '999px' }}>
              <div
                className="h-full bg-purple-700 transition-all duration-500"
                style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
              />
            </div>
            <span className="font-bold text-purple-700 tabular-nums" style={{ fontSize: '0.8rem' }}>
              {progressPercent}%
            </span>
          </div>
          {topicList}
        </div>
      </aside>

      {/* main area */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: '30rem',
            background: 'radial-gradient(ellipse 55% 45% at 50% 0%, rgba(126,34,206,0.05) 0%, transparent 100%)',
          }}
        />

        <div
          className="relative mx-auto grid grid-cols-12"
          style={{ maxWidth: '1440px', padding: '1.5rem 1rem', gap: '1.5rem' }}
        >
          {/* mobile top bar */}
          <div className="col-span-12 lg:hidden flex items-center" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-slate-200 transition-colors inline-flex items-center justify-center shrink-0"
              style={{ padding: '0.5rem', borderRadius: '0.75rem' }}
              aria-label="Отвори съдържание"
            >
              <span className="material-icons text-slate-600" style={{ fontSize: '1.375rem' }}>menu</span>
            </button>
            <button
              onClick={() => navigate('/study')}
              className="hover:bg-purple-50 transition-colors inline-flex items-center justify-center shrink-0"
              style={{ padding: '0.5rem', borderRadius: '0.75rem' }}
              aria-label="Назад"
            >
              <span className="material-icons text-purple-700" style={{ fontSize: '1.375rem' }}>arrow_back</span>
            </button>
            <div className="flex-1 flex items-center" style={{ gap: '0.5rem', marginLeft: '0.25rem' }}>
              <div className="flex-1 bg-slate-200 overflow-hidden" style={{ height: '0.5rem', borderRadius: '999px' }}>
                <div
                  className="h-full bg-purple-700"
                  style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
                />
              </div>
              <span className="font-bold text-purple-700 tabular-nums" style={{ fontSize: '0.75rem' }}>
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* left sidebar (desktop) */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky overflow-hidden" style={{ top: '5rem', height: 'calc(100vh - 6.5rem)' }}>
              <div
                className="h-full bg-white border border-slate-200/80 shadow-sm flex flex-col"
                style={{ borderRadius: '1rem' }}
              >
                {/* sidebar head */}
                <div className="shrink-0 border-b border-slate-100" style={{ padding: '1.25rem 1.25rem 1rem' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                    <p className="font-bold text-slate-800" style={{ fontSize: '1.05rem' }}>Съдържание</p>
                    <button
                      onClick={() => navigate('/study')}
                      className="hover:bg-purple-50 transition-colors inline-flex items-center justify-center shrink-0"
                      style={{ padding: '0.375rem', borderRadius: '0.5rem' }}
                      aria-label="Назад"
                    >
                      <span className="material-icons text-purple-700" style={{ fontSize: '1.25rem' }}>arrow_back</span>
                    </button>
                  </div>
                  <p className="text-slate-400" style={{ fontSize: '0.875rem', marginBottom: '0.875rem' }}>{subject.nameBg}</p>
                  <div className="flex items-center" style={{ gap: '0.625rem' }}>
                    <div className="flex-1 bg-slate-100 overflow-hidden" style={{ height: '0.5rem', borderRadius: '999px' }}>
                      <div
                        className="h-full bg-purple-700 transition-all duration-500"
                        style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
                      />
                    </div>
                    <span className="font-bold text-purple-700 tabular-nums" style={{ fontSize: '0.8rem' }}>
                      {progressPercent}%
                    </span>
                  </div>
                </div>
                {/* topic list */}
                <div className="flex-1 min-h-0 overflow-auto" style={{ padding: '0.625rem' }}>
                  {topicList}
                </div>
              </div>
            </div>
          </aside>

          {/* center content */}
          <main className="col-span-12 lg:col-span-6 min-w-0">
            <div className="mx-auto" style={{ maxWidth: '820px' }}>
              <div
                className="bg-white border border-slate-200/80 shadow-sm overflow-hidden"
                style={{ borderRadius: '1rem' }}
              >
                <div style={{ padding: '1.5rem' }} className="sm:!p-8 md:!p-10">
                  <h1
                    className="font-extrabold tracking-tight text-purple-800"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '1.5rem' }}
                  >
                    {currentSection?.titleBg}
                  </h1>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '1rem', lineHeight: '1.75' }}>
                    {currentSection?.content && renderContent(currentSection.content)}
                  </div>
                </div>

                {/* footer CTA */}
                <div
                  className="border-t border-slate-100 flex items-center justify-between"
                  style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}
                >
                  {currentSectionIndex > 0 ? (
                    <button
                      onClick={() => setCurrentSectionIndex((idx) => idx - 1)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center transition-colors"
                      style={{ height: '3rem', padding: '0 1.25rem', borderRadius: '0.875rem', fontSize: '0.875rem', gap: '0.5rem' }}
                    >
                      <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_back</span>
                      <span className="hidden sm:inline">Назад</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center" style={{ gap: '0.75rem' }}>
                    {currentSectionIndex < sections.length - 1 && (
                      <button
                        onClick={() => setCurrentSectionIndex((idx) => idx + 1)}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-semibold inline-flex items-center transition-all duration-200 shadow-md shadow-purple-700/20 hover:shadow-lg hover:shadow-purple-800/25 group"
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: '0.875rem', fontSize: '0.875rem', gap: '0.5rem' }}
                      >
                        Следваща секция
                        <span className="material-icons group-hover:translate-x-0.5 transition-transform" style={{ fontSize: '1.125rem' }}>
                          arrow_forward
                        </span>
                      </button>
                    )}
                    {canContinue && currentSectionIndex === sections.length - 1 && (
                      <button
                        onClick={handleContinue}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-semibold inline-flex items-center transition-all duration-200 shadow-md shadow-purple-700/20 hover:shadow-lg hover:shadow-purple-800/25"
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: '0.875rem', fontSize: '0.875rem', gap: '0.5rem' }}
                      >
                        Продължи към тест
                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* right sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div
              className="lg:sticky lg:overflow-hidden"
              style={{ top: '5rem', maxHeight: 'calc(100vh - 6.5rem)' }}
            >
              <div className="lg:h-full lg:overflow-auto flex flex-col" style={{ gap: '1.25rem' }}>
                <div
                  className="bg-white border border-slate-200/80 shadow-sm"
                  style={{ borderRadius: '1rem', padding: '1.5rem' }}
                >
                  <p className="font-bold text-slate-800" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Секции</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sections.map((sec, idx) => {
                      const isActive = idx === currentSectionIndex;
                      const icon = getSectionIcon(sec.id, sec.titleBg);
                      return (
                        <button
                          key={sec.id}
                          onClick={() => setCurrentSectionIndex(idx)}
                          className={`flex items-center w-full text-left transition-all duration-200 group ${
                            isActive
                              ? 'bg-purple-50 text-purple-800 font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                          style={{
                            padding: '1rem 1.125rem',
                            borderRadius: '0.875rem',
                            fontSize: '0.95rem',
                            gap: '0.75rem',
                            borderLeft: isActive ? '3px solid rgb(126, 34, 206)' : '3px solid transparent',
                          }}
                        >
                          <span
                            className={`material-icons shrink-0 transition-colors ${
                              isActive
                                ? 'text-purple-700'
                                : 'text-slate-400 group-hover:text-purple-600'
                            }`}
                            style={{ fontSize: '1.375rem' }}
                          >
                            {icon}
                          </span>
                          <span>{sec.titleBg}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
