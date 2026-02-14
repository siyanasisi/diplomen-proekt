import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-br from-slate-50 via-purple-50/30 to-purple-100/20">
        <p className="text-slate-500 font-medium">Зареждане...</p>
      </div>
    );
  }

  const allAnswered =
    test.questions.length > 0 &&
    test.questions.every((q) => answers[q.id] != null && answers[q.id] !== '');

  if (state === 'result') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/40 to-purple-100/20 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-auto">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden relative z-10">
          <div className="p-8 sm:p-10 md:p-12 text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mb-6 sm:mb-8 ${
                (score ?? 0) >= 60
                  ? 'bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10'
                  : 'bg-amber-50 text-amber-600 shadow-lg shadow-amber-500/10'
              }`}
            >
              <span className="text-3xl sm:text-4xl font-bold">{score}%</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Резултат от теста</h2>
            <p className="text-slate-500 mb-8 sm:mb-10 leading-relaxed text-base sm:text-lg">
              {correctCount} от {test.questions.length} верни отговора. Резултатът е записан.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {nextFromPlan && (
                <button
                  onClick={handleNextTopicFromPlan}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-900 to-purple-800 text-white font-semibold hover:from-purple-800 hover:to-purple-700 shadow-lg shadow-purple-900/20 transition-all min-h-[48px] text-base"
                >
                  Следваща тема от плана →
                </button>
              )}
              {isLastOfDay && (
                <button
                  onClick={handleFinishDay}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-600/20 transition-all min-h-[48px] text-base"
                >
                  Приключи деня (маркирай като научен)
                </button>
              )}
              <button
                onClick={handleNextTopic}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all min-h-[48px] text-base"
              >
                Следваща тема в реда
              </button>
              <button
                onClick={handleRandomTopic}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all min-h-[48px] text-base"
              >
                Случайна неизучена тема
              </button>
            </div>

            <button
              onClick={handleBackToStudy}
              className="mt-6 sm:mt-8 w-full py-3 text-slate-500 hover:text-purple-600 font-medium text-sm transition-colors min-h-[44px]"
            >
              Обратно към учене
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/40 to-purple-100/20 py-8 sm:py-10 md:py-12 lg:py-14 px-4 sm:px-6 lg:px-8 relative overflow-auto">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2 sm:mb-3">
            Тест: <span className="text-purple-700">{topic.titleBg}</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg md:text-xl max-w-xl">
            Изберете един отговор на всеки въпрос. След предаване резултатът ще бъде записан.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6 sm:space-y-8 md:space-y-10"
        >
          {test.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q, qIdx) => (
              <div
                key={q.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-5 sm:p-6 md:p-8 shadow-sm hover:shadow-md hover:shadow-purple-900/10 transition-shadow"
              >
                <p className="text-xs sm:text-sm font-semibold text-purple-600/90 uppercase tracking-wider mb-3 sm:mb-4">
                  Въпрос {qIdx + 1}
                </p>
                <p className="font-semibold text-slate-900 text-base sm:text-lg md:text-xl mb-4 sm:mb-5 md:mb-6 leading-snug">
                  {q.questionBg}
                </p>
                <div className="space-y-2 sm:space-y-3">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 min-h-[52px] sm:min-h-0 ${
                        answers[q.id] === opt.id
                          ? 'border-purple-500 bg-purple-50/50 shadow-sm shadow-purple-500/10'
                          : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 accent-purple-600 flex-shrink-0"
                      />
                      <span className="text-slate-800 font-medium text-sm sm:text-base">{opt.textBg}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={!allAnswered}
              className="px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-900 to-purple-800 text-white font-semibold hover:from-purple-800 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 hover:shadow-xl transition-all min-h-[48px] text-base"
            >
              Предай тест
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 sm:py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors min-h-[48px] text-base"
            >
              Назад
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
