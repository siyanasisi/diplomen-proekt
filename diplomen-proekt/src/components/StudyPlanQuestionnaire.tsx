import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { KnowledgeLevel, StudyPlanPreferences, ExamSubject } from "../lib/topics";
import { SCHOOL_SUBJECTS, hasPlanContent, normalizeExamSubject } from "../lib/topics";
import { generateStudyPlan, calculateDaysUntilExam } from "../lib/studyPlanGenerator";
import { useAuth } from "../context/AuthContext";
import { supabase, ensureValidSession } from "../supabase-client";
import { DatePickerCalendar } from "./ui/DatePickerCalendar";
import { AlertBanner } from "./ui/feedback/AlertBanner";
import { useToast } from "../context/ToastContext";
import { getTodayDateKey } from "../lib/calendar";

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

export const StudyPlanQuestionnaire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const [examSubject, setExamSubject] = useState<ExamSubject>("БЕЛ");
  const [examDate, setExamDate] = useState<string>("");
  const [daysUntilExam, setDaysUntilExam] = useState<number>(0);
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState<number>(3);
  const [topicsPerDay, setTopicsPerDay] = useState<number>(2);
  const [belLevel, setBelLevel] = useState<KnowledgeLevel>("intermediate");
  const [literatureLevel, setLiteratureLevel] = useState<KnowledgeLevel>("intermediate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("exam_subject")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data?.exam_subject) {
        setExamSubject(normalizeExamSubject(data.exam_subject));
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleExamDateChange = (date: string) => {
    setExamDate(date);
    if (date) setDaysUntilExam(calculateDaysUntilExam(new Date(date)));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 2 && !examDate) {
        showToast("Моля, изберете дата на изпита", "warning");
        return;
      }
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast("Моля, влезте в акаунта си", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await ensureValidSession();
      const preferences: StudyPlanPreferences = {
        examSubject, examDate: new Date(examDate),
        studyDaysPerWeek, topicsPerDay, belLevel, literatureLevel,
      };
      const plan = generateStudyPlan(preferences, user.id);
      const row = {
        user_id: user.id, exam_subject: examSubject,
        preferences: {
          exam_subject: examSubject, exam_date: examDate,
          study_days_per_week: studyDaysPerWeek, topics_per_day: topicsPerDay,
          bel_level: belLevel, literature_level: literatureLevel,
        },
        plan: plan.plan, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('study_plans')
        .upsert(row, { onConflict: 'user_id,exam_subject', ignoreDuplicates: false })
        .select().single();
      if (error) {
        console.error('Error saving study plan:', error);
        showToast('Възникна грешка при запазването на плана. Моля, опитайте отново.', 'error');
        setIsSubmitting(false);
        return;
      }
      await supabase.from("profiles").update({ exam_subject: examSubject }).eq("id", user.id);
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Failed to create study plan:', error);
      showToast('Възникна грешка. Моля, опитайте отново.', 'error');
      setIsSubmitting(false);
    }
  };

  const today = getTodayDateKey();
  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  const optBtn = (selected: boolean) =>
    `flex items-center w-full text-left transition-all duration-200 ${
      selected
        ? 'border-purple-600 bg-purple-50/60 text-purple-800 font-semibold'
        : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-700 font-medium bg-white'
    }`;

  return (
    <div className="min-h-full bg-slate-50 relative">
      {/* bg accent */}
      <div
        className="pointer-events-none fixed top-0 right-0 -z-10 opacity-40"
        style={{ width: '33%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.05), transparent)' }}
      />

      {/* sticky header */}
      <header
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200"
        style={{ height: '4rem' }}
      >
        <div
          className="h-full mx-auto flex items-center justify-between"
          style={{ maxWidth: '48rem', padding: '0 1.5rem' }}
        >
          <div className="flex items-center min-w-0" style={{ gap: '0.75rem' }}>
            <button
              onClick={() => currentStep === 1 ? navigate(-1) : handleBack()}
              className="hover:bg-purple-50 transition-colors shrink-0 inline-flex items-center justify-center"
              style={{ padding: '0.5rem', borderRadius: '0.625rem' }}
            >
              <span className="material-icons text-purple-700" style={{ fontSize: '1.375rem' }}>arrow_back</span>
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-slate-400 uppercase leading-none" style={{ fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
                Създай план
              </p>
              <p className="font-bold text-slate-900 truncate" style={{ fontSize: '1rem' }}>
                Стъпка {currentStep} от {TOTAL_STEPS}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center" style={{ gap: '1rem' }}>
            <span className="font-bold text-purple-700" style={{ fontSize: '0.875rem' }}>
              {progressPercent}%
            </span>
            <div className="bg-slate-200 overflow-hidden" style={{ width: '8rem', height: '0.5rem', borderRadius: '999px' }}>
              <div
                className="h-full bg-purple-700 transition-all duration-500"
                style={{ width: `${progressPercent}%`, borderRadius: '999px' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* main */}
      <main style={{ maxWidth: '48rem', padding: '2.5rem 1.5rem 5rem', marginLeft: 'clamp(2rem, 12vw, 16rem)', marginRight: 'auto' }}>
        {/* mobile progress */}
        <div className="sm:hidden flex items-center" style={{ gap: '0.625rem', marginBottom: '2rem' }}>
          <div className="flex-1 bg-slate-200 overflow-hidden" style={{ height: '0.5rem', borderRadius: '999px' }}>
            <div className="h-full bg-purple-700" style={{ width: `${progressPercent}%`, borderRadius: '999px' }} />
          </div>
          <span className="font-bold text-purple-700 tabular-nums" style={{ fontSize: '0.8rem' }}>{progressPercent}%</span>
        </div>

        {/* card */}
        <div
          className="bg-white border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ borderRadius: '1rem', padding: '2rem' }}
        >
          {/* ═══ STEP 1 ═══ */}
          {currentStep === 1 && (
            <div>
              <h2 className="font-extrabold text-purple-800 leading-tight" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
                По какъв предмет ще е матурата?
              </h2>
              <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Избери предмета, по който ще се явяваш на изпита.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {SCHOOL_SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setExamSubject(subject)}
                    className={optBtn(examSubject === subject)}
                    style={{
                      padding: '1rem 1.125rem',
                      borderRadius: '0.875rem',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      fontSize: '1rem',
                      gap: '0.75rem',
                    }}
                  >
                    {examSubject === subject && (
                      <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.25rem' }}>check_circle</span>
                    )}
                    <span>{subject}</span>
                  </button>
                ))}
              </div>

              {!hasPlanContent(examSubject) && (
                <AlertBanner
                  variant="warning"
                  style={{ marginTop: '1.5rem' }}
                >
                  <p className="font-semibold" style={{ fontSize: '0.95rem' }}>
                    За предмет „{examSubject}" все още няма готово съдържание.
                  </p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.375rem', lineHeight: '1.5', opacity: 0.9 }}>
                    Ще запазим избора ти и ще го активираме, когато има план за учене.
                  </p>
                </AlertBanner>
              )}
            </div>
          )}

          {/* question 2 */}
          {currentStep === 2 && (
            <div>
              <h2 className="font-extrabold text-purple-800 leading-tight" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
                Кога е твоята матура?
              </h2>
              <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Избери датата, когато ще се явиш на изпита.
              </p>

              <DatePickerCalendar
                value={examDate}
                onChange={handleExamDateChange}
                minDate={today}
              />
              {daysUntilExam > 0 && (
                <div
                  className="bg-purple-50 border border-purple-100"
                  style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '0.875rem' }}
                >
                  <p className="text-purple-900 font-bold" style={{ fontSize: '1.1rem' }}>
                    Остават <span className="text-purple-700" style={{ fontSize: '1.75rem' }}>{daysUntilExam}</span> дни до изпита
                  </p>
                </div>
              )}
            </div>
          )}

          {/* question 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="font-extrabold text-purple-800 leading-tight" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
                Колко дни в седмицата можеш да учиш?
              </h2>
              <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Избери колко дни на седмица можеш да посветиш на учене.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[2, 3, 4, 5, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setStudyDaysPerWeek(days)}
                    className={optBtn(studyDaysPerWeek === days)}
                    style={{
                      padding: '1.125rem 1rem',
                      borderRadius: '0.875rem',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      fontSize: '1rem',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <span>{days === 7 ? 'Всеки ден' : `${days} дни`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* question 4 */}
          {currentStep === 4 && (
            <div>
              <h2 className="font-extrabold text-purple-800 leading-tight" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
                По колко теми на ден искаш да учиш?
              </h2>
              <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Избери натоварването, с което се чувстваш комфортно.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[1, 2, 3, 4].map((n) => {
                  const label = n === 1 ? '1 тема на ден' : n === 4 ? '4+ теми на ден' : `${n} теми на ден`;
                  const desc = n === 1 ? 'Спокойно темпо' : n === 2 ? 'Балансирано' : n === 3 ? 'Интензивно' : 'Максимално';
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTopicsPerDay(n)}
                      className={optBtn(topicsPerDay === n)}
                      style={{
                        padding: '1rem 1.125rem',
                        borderRadius: '0.875rem',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        fontSize: '1rem',
                        gap: '0.75rem',
                      }}
                    >
                      <div className="flex-1">
                        <span className="block">{label}</span>
                        <span className={`block ${topicsPerDay === n ? 'text-purple-600' : 'text-slate-400'}`} style={{ fontSize: '0.8rem', marginTop: '0.125rem' }}>
                          {desc}
                        </span>
                      </div>
                      {topicsPerDay === n && (
                        <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.25rem' }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {topicsPerDay >= 3 && (
                <AlertBanner
                  variant="warning"
                  message="Високото натоварване може да бъде трудно за поддържане. Бъди реалистичен."
                  style={{ marginTop: '1.5rem' }}
                />
              )}
            </div>
          )}

          {/* question 5 */}
          {currentStep === 5 && (
            <div>
              <h2 className="font-extrabold text-purple-800 leading-tight" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
                Какво е твоето ниво?
              </h2>
              <p className="text-slate-500" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                {examSubject === "БЕЛ"
                  ? "Оцени своето текущо ниво по Български език и по Литература."
                  : "Оцени своето текущо ниво по избрания предмет."}
              </p>

              {!hasPlanContent(examSubject) ? (
                <div className="bg-slate-50 border border-slate-200" style={{ padding: '1.5rem', borderRadius: '0.875rem' }}>
                  <p className="text-slate-600 font-medium text-center" style={{ fontSize: '0.95rem' }}>
                    За предмет „{examSubject}" все още няма учебно съдържание. Ще запазим избора ти.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {examSubject === "БЕЛ" && (
                    <>
                      {/* БЕ */}
                      <div>
                        <h3 className="font-bold text-slate-900" style={{ fontSize: '1.125rem', marginBottom: '0.875rem' }}>Български език</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => {
                            const labels: Record<KnowledgeLevel, string> = { beginner: 'Начинаещ', intermediate: 'Средно ниво', advanced: 'Добро ниво' };
                            const descs: Record<KnowledgeLevel, string> = { beginner: 'Нужно е повече упражнение', intermediate: 'Имам базови познания', advanced: 'Чувствам се уверено' };
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setBelLevel(level)}
                                className={optBtn(belLevel === level)}
                                style={{
                                  padding: '1rem 1.125rem', borderRadius: '0.875rem',
                                  borderWidth: '2px', borderStyle: 'solid', fontSize: '1rem', gap: '0.75rem',
                                }}
                              >
                                <div className="flex-1">
                                  <span className="block">{labels[level]}</span>
                                  <span className={`block ${belLevel === level ? 'text-purple-600' : 'text-slate-400'}`} style={{ fontSize: '0.8rem', marginTop: '0.125rem' }}>
                                    {descs[level]}
                                  </span>
                                </div>
                                {belLevel === level && (
                                  <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.25rem' }}>check_circle</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Литература */}
                      <div>
                        <h3 className="font-bold text-slate-900" style={{ fontSize: '1.125rem', marginBottom: '0.875rem' }}>Литература</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => {
                            const labels: Record<KnowledgeLevel, string> = { beginner: 'Начинаещ', intermediate: 'Средно ниво', advanced: 'Добро ниво' };
                            const descs: Record<KnowledgeLevel, string> = { beginner: 'Нужно е повече упражнение', intermediate: 'Имам базови познания', advanced: 'Чувствам се уверено' };
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setLiteratureLevel(level)}
                                className={optBtn(literatureLevel === level)}
                                style={{
                                  padding: '1rem 1.125rem', borderRadius: '0.875rem',
                                  borderWidth: '2px', borderStyle: 'solid', fontSize: '1rem', gap: '0.75rem',
                                }}
                              >
                                <div className="flex-1">
                                  <span className="block">{labels[level]}</span>
                                  <span className={`block ${literatureLevel === level ? 'text-purple-600' : 'text-slate-400'}`} style={{ fontSize: '0.8rem', marginTop: '0.125rem' }}>
                                    {descs[level]}
                                  </span>
                                </div>
                                {literatureLevel === level && (
                                  <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.25rem' }}>check_circle</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* footer */}
          <footer
            className="border-t border-slate-100 flex items-center justify-between"
            style={{ marginTop: '2.5rem', paddingTop: '1.5rem', gap: '1rem' }}
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-slate-500 font-semibold hover:text-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center"
              style={{ gap: '0.5rem', fontSize: '0.925rem', padding: '0.5rem 0' }}
            >
              <span className="material-icons" style={{ fontSize: '1.25rem' }}>arrow_back</span>
              Назад
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-all duration-200 shadow-md shadow-purple-700/20 hover:shadow-lg hover:shadow-purple-800/25 inline-flex items-center"
                style={{ height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', fontSize: '0.95rem', gap: '0.5rem' }}
              >
                Напред
                <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-md shadow-purple-700/20 hover:shadow-lg hover:shadow-purple-800/25 inline-flex items-center"
                style={{ height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', fontSize: '0.95rem', gap: '0.5rem' }}
              >
                {isSubmitting ? 'Създаване...' : 'Създай план'}
                {!isSubmitting && <span className="material-icons" style={{ fontSize: '1.125rem' }}>check</span>}
              </button>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
};
