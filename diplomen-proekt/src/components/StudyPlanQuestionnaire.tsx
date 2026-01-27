import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { KnowledgeLevel, StudyPlanPreferences } from "../lib/topics";
import { generateStudyPlan, calculateDaysUntilExam } from "../lib/studyPlanGenerator";
import { useAuth } from "../context/AuthContext";
import { supabase, ensureValidSession } from "../supabase-client";

type Step = 1 | 2 | 3 | 4;

export const StudyPlanQuestionnaire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const [examDate, setExamDate] = useState<string>("");
  const [daysUntilExam, setDaysUntilExam] = useState<number>(0);

  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState<number>(3);

  const [topicsPerDay, setTopicsPerDay] = useState<number>(2);

  const [belLevel, setBelLevel] = useState<KnowledgeLevel>("intermediate");
  const [literatureLevel, setLiteratureLevel] = useState<KnowledgeLevel>("intermediate");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExamDateChange = (date: string) => {
    setExamDate(date);
    if (date) {
      const days = calculateDaysUntilExam(new Date(date));
      setDaysUntilExam(days);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (currentStep === 1 && !examDate) {
        alert("Моля, изберете дата на изпита");
        return;
      }
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Моля, влезте в акаунта си");
      return;
    }

    setIsSubmitting(true);

    try {
      await ensureValidSession();

      const preferences: StudyPlanPreferences = {
        examDate: new Date(examDate),
        studyDaysPerWeek,
        topicsPerDay,
        belLevel,
        literatureLevel,
      };

      const plan = generateStudyPlan(preferences, user.id);

      const { error } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          preferences: {
            exam_date: examDate,
            study_days_per_week: studyDaysPerWeek,
            topics_per_day: topicsPerDay,
            bel_level: belLevel,
            literature_level: literatureLevel,
          },
          plan: plan.plan,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving study plan:', error);
        alert('Възникна грешка при запазването на плана. Моля, опитайте отново.');
        setIsSubmitting(false);
        return;
      }

      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Failed to create study plan:', error);
      alert('Възникна грешка. Моля, опитайте отново.');
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center p-4 overflow-y-auto py-8">
      <div className="max-w-2xl w-full my-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 p-8 md:p-12">
          {/* progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Стъпка {currentStep} от 4</span>
              <span className="text-sm text-slate-500">{Math.round((currentStep / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-rose-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* question 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Кога е твоята матура?</h2>
              <p className="text-slate-600">Избери датата, когато ще извършиш изпита.</p>
              
              <div className="space-y-4">
                <input
                  type="date"
                  value={examDate}
                  min={today}
                  onChange={(e) => handleExamDateChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none text-lg"
                />
                
                {daysUntilExam > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 font-semibold">
                      Остават <span className="text-2xl">{daysUntilExam}</span> дни до изпита
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* question 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Колко дни в седмицата можеш да учиш?</h2>
              <p className="text-slate-600">Избери колко дни на седмица можеш да посветиш на учене.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[2, 3, 4, 5].map((days) => (
                  <button
                    key={days}
                    onClick={() => setStudyDaysPerWeek(days)}
                    className={`px-6 py-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                      studyDaysPerWeek === days
                        ? 'border-rose-500 bg-rose-50 text-rose-700 scale-105'
                        : 'border-slate-300 hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    {days} дни
                  </button>
                ))}
                <button
                  onClick={() => setStudyDaysPerWeek(7)}
                  className={`px-6 py-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                    studyDaysPerWeek === 7
                      ? 'border-rose-500 bg-rose-50 text-rose-700 scale-105'
                      : 'border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  Всеки ден
                </button>
              </div>
            </div>
          )}

          {/* question 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">По колко теми на ден искаш да учиш?</h2>
              <p className="text-slate-600">Избери натоварването, с което се чувстваш комфортно.</p>
              
              <div className="space-y-6">
                <div className="px-4">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={topicsPerDay}
                    onChange={(e) => setTopicsPerDay(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between mt-2 text-sm text-slate-600">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>Повече</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-100 rounded-xl">
                  <p className="text-slate-700 font-semibold text-center text-lg">
                    {topicsPerDay === 1 && "1 тема на ден"}
                    {topicsPerDay === 2 && "2 теми на ден"}
                    {topicsPerDay === 3 && "3 теми на ден"}
                    {topicsPerDay === 4 && "4+ теми на ден"}
                  </p>
                </div>

                {topicsPerDay >= 3 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Избраното натоварване е високо и може да бъде трудно за поддържане.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* question 4 */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Какво е твоето ниво?</h2>
              <p className="text-slate-600">Оцени своето текущо ниво по всеки предмет.</p>
              
              <div className="space-y-6">
                {/* Български език */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Български език</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setBelLevel(level)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 font-semibold ${
                          belLevel === level
                            ? 'border-rose-500 bg-rose-50 text-rose-700 scale-105'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        {level === 'beginner' && 'Начинаещ'}
                        {level === 'intermediate' && 'Средно ниво'}
                        {level === 'advanced' && 'Добро ниво'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Литература */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Литература</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setLiteratureLevel(level)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 font-semibold ${
                          literatureLevel === level
                            ? 'border-rose-500 bg-rose-50 text-rose-700 scale-105'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        {level === 'beginner' && 'Начинаещ'}
                        {level === 'intermediate' && 'Средно ниво'}
                        {level === 'advanced' && 'Добро ниво'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* nav buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-500/30 hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                Напред
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/30 hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Създаване...' : 'Създай план'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
