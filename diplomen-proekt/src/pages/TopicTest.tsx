import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useProgress } from '../context/ProgressContext';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { getTopicById, getTestForTopic } from '../data/curriculum';
import type { TopicId } from '../types/learning';

type TestState = 'answering' | 'result';

export function TopicTest() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const showToast = useToast();
  const { recordTestSubmitted, getNextTopicInSequence, getRandomUncompletedTopic } = useProgress();
  const { getNextTopicFromPlan, isLastTopicOfDay, markDayCompleted, getTodayPlanTopicIds, getTodayDateKey } = useStudyPlan(user?.id ?? null);

  const topic = topicId ? getTopicById(topicId) : null;
  const test = topicId ? getTestForTopic(topicId) : null;

  const [state, setState] = useState<TestState>('answering');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const locationState = location.state as {
    subjectId?: string;
    topicId?: string;
    todayPlanTopicIds?: string[];
    todayDate?: string;
  } | null;
  const subjectId = locationState?.subjectId ?? topic?.subjectId;
  const savedTopicId = locationState?.topicId ?? topicId;
  const todayDate = locationState?.todayDate;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!topicId || !topic || !test?.questions?.length) {
      navigate('/study', { replace: true });
      return;
    }
  }, [user, topicId, topic, test, navigate]);

  const sortedQuestions = useMemo(
    () => test?.questions?.slice().sort((a, b) => a.order - b.order) ?? [],
    [test],
  );

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = sortedQuestions.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSubmit = () => {
    if (!test || !topicId) return;
    let correct = 0;
    test.questions.forEach((q) => {
      const chosen = answers[q.id];
      const rightOption = q.options.find((o) => o.isCorrect);
      if (rightOption && chosen === rightOption.id) correct++;
    });
    const percent = Math.round((correct / test.questions.length) * 100);
    setCorrectCount(correct);
    setScore(percent);
    recordTestSubmitted(topicId as TopicId, percent);
    setState('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextFromPlan = topicId ? getNextTopicFromPlan(topicId) : null;
  const isLastOfDay = topicId ? isLastTopicOfDay(topicId) : false;

  const handleNextTopic = () => {
    if (!subjectId || !savedTopicId) return;
    const next = getNextTopicInSequence(subjectId, savedTopicId);
    if (next) {
      navigate(`/study/learn/${next.subjectId}/${next.topicId}`, { replace: true });
    } else {
      navigate('/study', { replace: true });
    }
  };

  const handleNextTopicFromPlan = () => {
    if (!nextFromPlan) return;
    const todayPlanTopicIds = getTodayPlanTopicIds();
    const dateKey = todayDate ?? new Date().toISOString().slice(0, 10);
    navigate(`/study/learn/${nextFromPlan.subjectId}/${nextFromPlan.topicId}`, {
      replace: true,
      state: { fromPlan: true, todayPlanTopicIds, todayDate: dateKey },
    });
  };

  const handleFinishDay = async () => {
    const dateToMark = todayDate ?? getTodayDateKey();
    if (dateToMark) {
      const ok = await markDayCompleted(dateToMark);
      if (ok) showToast('Денят е маркиран като научен.');
    }
    navigate('/home', { replace: true });
  };

  const handleRandomTopic = () => {
    const next = getRandomUncompletedTopic();
    if (next) {
      navigate(`/study/learn/${next.subjectId}/${next.topicId}`, { replace: true });
    } else {
      navigate('/study', { replace: true });
    }
  };

  const handleBackToStudy = () => {
    navigate('/study', { replace: true });
  };

  if (!topic || !test) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <p className="text-slate-500 font-medium text-lg">Зареждане...</p>
      </div>
    );
  }

  const allAnswered =
    test.questions.length > 0 &&
    test.questions.every((q) => answers[q.id] != null && answers[q.id] !== '');

  if (state === 'result') {
    const passed = (score ?? 0) >= 60;
    return (
      <div className="min-h-full bg-slate-50 relative overflow-auto">
        {/* bg accents */}
        <div
          className="pointer-events-none fixed top-0 right-0 -z-10 opacity-40"
          style={{ width: '33%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.05), transparent)' }}
        />

        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem)', padding: '2rem 1rem' }}>
          <div
            className="w-full bg-white border border-slate-200/80 shadow-lg overflow-hidden"
            style={{ maxWidth: '28rem', borderRadius: '1.25rem' }}
          >
            <div style={{ padding: '2.5rem 2rem' }} className="text-center sm:!p-12">
              {/* score badge */}
              <div
                className={`inline-flex items-center justify-center ${
                  passed
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
                style={{ width: '5.5rem', height: '5.5rem', borderRadius: '1rem', marginBottom: '1.75rem' }}
              >
                <span className="font-extrabold" style={{ fontSize: '2rem' }}>{score}%</span>
              </div>

              <h2 className="font-bold text-slate-900" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Резултат от теста
              </h2>
              <p className="text-slate-500 leading-relaxed" style={{ fontSize: '1.05rem', marginBottom: '2.5rem' }}>
                {correctCount} от {test.questions.length} верни отговора.
                <br />
                Резултатът е записан автоматично.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={handleNextTopic}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-all shadow-md shadow-purple-700/20 hover:shadow-lg"
                  style={{ padding: '1rem 1.5rem', borderRadius: '0.875rem', fontSize: '0.95rem' }}
                >
                  Следваща тема в реда
                </button>
                <button
                  onClick={handleRandomTopic}
                  className="w-full border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                  style={{ padding: '0.875rem 1.5rem', borderRadius: '0.875rem', fontSize: '0.95rem' }}
                >
                  Случайна неизучена тема
                </button>
              </div>

              <button
                onClick={handleBackToStudy}
                className="text-slate-500 hover:text-purple-700 font-medium transition-colors"
                style={{ marginTop: '1.5rem', fontSize: '0.875rem', padding: '0.5rem' }}
              >
                Обратно към учене
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 relative">
      {/* bg accents */}
      <div
        className="pointer-events-none fixed top-0 right-0 -z-10 opacity-40"
        style={{ width: '33%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.05), transparent)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 -z-10 opacity-25"
        style={{ width: '25%', height: '50vh', background: 'linear-gradient(to top right, rgba(126,34,206,0.05), transparent)' }}
      />

      {/* header */}
      <header
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200"
        style={{ height: '4rem' }}
      >
        <div
          className="h-full flex items-center justify-between"
          style={{ maxWidth: '48rem', padding: '0 1.5rem', marginLeft: '8rem', marginRight: '4rem' }}
        >
          <div className="flex items-center min-w-0" style={{ gap: '0.75rem' }}>
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-purple-50 transition-colors shrink-0 inline-flex items-center justify-center"
              style={{ padding: '0.5rem', borderRadius: '0.625rem' }}
            >
              <span className="material-icons text-purple-700" style={{ fontSize: '1.375rem' }}>arrow_back</span>
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-slate-400 uppercase leading-none" style={{ fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
                Тест за тема
              </p>
              <p className="font-bold text-slate-900 truncate" style={{ fontSize: '1rem', maxWidth: '16rem' }}>
                {topic.titleBg}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center" style={{ gap: '1rem' }}>
            <div className="text-right">
              <p className="text-slate-400 font-medium" style={{ fontSize: '0.6875rem' }}>Прогрес</p>
              <p className="font-bold text-purple-700" style={{ fontSize: '0.875rem' }}>
                {answeredCount} / {totalQuestions}
              </p>
            </div>
            <div className="bg-slate-200 overflow-hidden" style={{ width: '8rem', height: '0.5rem', borderRadius: '999px' }}>
              <div
                className="h-full bg-purple-700 transition-all duration-500"
                style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* main content */}
      <main style={{ maxWidth: '48rem', padding: '2.5rem 1.5rem 5rem', marginLeft: '8rem', marginRight: '4rem' }}>
        {/* title block */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1
            className="font-extrabold text-purple-800 leading-tight"
            style={{ fontSize: 'clamp(1.625rem, 4vw, 2.25rem)', marginBottom: '1rem' }}
          >
            Тест: "{topic.titleBg}"
          </h1>
          <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '36rem' }}>
            Изберете един отговор на всеки въпрос. След предаване резултатът ще бъде записан автоматично.
          </p>
        </div>

        {/* mobile progress */}
        <div className="sm:hidden flex items-center" style={{ gap: '0.625rem', marginBottom: '2rem' }}>
          <div className="flex-1 bg-slate-200 overflow-hidden" style={{ height: '0.5rem', borderRadius: '999px' }}>
            <div
              className="h-full bg-purple-700"
              style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
            />
          </div>
          <span className="font-bold text-purple-700 tabular-nums" style={{ fontSize: '0.8rem' }}>
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* questions */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
          {sortedQuestions.map((q, qIdx) => {
            const isAnswered = answers[q.id] != null;
            return (
              <section
                key={q.id}
                className={`bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md ${
                  !isAnswered && qIdx > 0 ? 'opacity-70 hover:opacity-100' : ''
                }`}
                style={{ borderRadius: '1rem', padding: '1.75rem' }}
              >
                <div>
                  {/* question badge */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <span
                      className={`inline-block font-bold uppercase ${
                        isAnswered
                          ? 'text-purple-700 bg-purple-50'
                          : 'text-slate-400 bg-slate-100'
                      }`}
                      style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', padding: '0.3rem 0.75rem', borderRadius: '999px' }}
                    >
                      Въпрос {qIdx + 1}
                    </span>
                  </div>

                  {/* question text */}
                  <h3
                    className="font-bold text-slate-900 leading-snug"
                    style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}
                  >
                    {q.questionBg}
                  </h3>

                  {/* options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center cursor-pointer transition-all duration-200 ${
                            selected
                              ? 'border-purple-600 bg-purple-50/60'
                              : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 bg-white'
                          }`}
                          style={{
                            gap: '1rem',
                            padding: '1rem 1.125rem',
                            borderRadius: '0.875rem',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.id}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                            className="accent-purple-700 shrink-0"
                            style={{ width: '1.375rem', height: '1.375rem' }}
                          />
                          <span
                            className={`${selected ? 'font-semibold text-purple-800' : 'font-medium text-slate-700'}`}
                            style={{ fontSize: '1.025rem' }}
                          >
                            {opt.textBg}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}

          {/* footer */}
          <footer
            className="border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between"
            style={{ marginTop: '1.5rem', paddingTop: '2rem', gap: '1.5rem' }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-500 font-semibold hover:text-purple-700 transition-colors order-2 sm:order-1"
              style={{ gap: '0.5rem', fontSize: '0.925rem', padding: '0.5rem 0' }}
            >
              <span className="material-icons" style={{ fontSize: '1.25rem' }}>arrow_back</span>
              Назад към темата
            </button>

            <button
              type="submit"
              disabled={!allAnswered}
              className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-purple-700/20 hover:shadow-xl hover:shadow-purple-800/25 order-1 sm:order-2"
              style={{ padding: '1rem 2.5rem', borderRadius: '0.875rem', fontSize: '0.95rem' }}
            >
              Предай тест
            </button>
          </footer>
        </form>
      </main>
    </div>
  );
}
