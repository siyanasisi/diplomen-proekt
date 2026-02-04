import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { getTopicById, getTestForTopic } from '../data/curriculum';
import type { TopicId } from '../types/learning';

type TestState = 'answering' | 'result';

export function TopicTest() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { recordTestSubmitted, getNextTopicInSequence, getRandomUncompletedTopic } = useProgress();

  const topic = topicId ? getTopicById(topicId) : null;
  const test = topicId ? getTestForTopic(topicId) : null;

  const [state, setState] = useState<TestState>('answering');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const subjectId = (location.state?.subjectId as string) ?? topic?.subjectId;
  const savedTopicId = (location.state?.topicId as string) ?? topicId;

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

  const handleNextTopic = () => {
    if (!subjectId || !savedTopicId) return;
    const next = getNextTopicInSequence(subjectId, savedTopicId);
    if (next) {
      navigate(`/study/learn/${next.subjectId}/${next.topicId}`, { replace: true });
    } else {
      navigate('/study', { replace: true });
    }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Зареждане...</p>
      </div>
    );
  }

  const allAnswered =
    test.questions.length > 0 &&
    test.questions.every((q) => answers[q.id] != null && answers[q.id] !== '');

  if (state === 'result') {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-rose-50/20 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${
                (score ?? 0) >= 60
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className="text-3xl font-bold">{score}%</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Резултат от теста</h2>
            <p className="text-slate-600 mb-6">
              {correctCount} от {test.questions.length} верни отговора. Резултатът е записан.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleNextTopic}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-700 shadow-lg transition-all"
              >
                Следваща тема в реда
              </button>
              <button
                onClick={handleRandomTopic}
                className="w-full py-3.5 px-6 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
              >
                Случайна неизучена тема
              </button>
            </div>

            <button
              onClick={handleBackToStudy}
              className="mt-4 w-full py-2.5 text-slate-500 hover:text-slate-700 font-medium text-sm"
            >
              Обратно към учене
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-rose-50/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Тест: {topic.titleBg}</h1>
        <p className="text-slate-600 mb-8">
          Изберете един отговор на всеки въпрос. След предаване резултатът ще бъде записан.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-8"
        >
          {test.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <p className="font-semibold text-slate-900 mb-4">{q.questionBg}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        answers[q.id] === opt.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
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
                        className="w-4 h-4 text-slate-900"
                      />
                      <span className="text-slate-800">{opt.textBg}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={!allAnswered}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
            >
              Предай тест
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Назад
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
