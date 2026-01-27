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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto py-12 sm:py-16 lg:py-20">
      <div className="max-w-3xl w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 md:p-14 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
          
          {/* progress bar */}
          <div className="mb-10 sm:mb-12 md:mb-14">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-bold text-slate-700">Стъпка {currentStep} от 4</span>
              <span className="text-sm sm:text-base font-semibold text-slate-500">{Math.round((currentStep / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200/60 rounded-full h-3 sm:h-3.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 h-3 sm:h-3.5 rounded-full transition-all duration-500 shadow-lg shadow-pink-500/30"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* question 1 */}
          {currentStep === 1 && (
            <div className="space-y-8 sm:space-y-10">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">Кога е твоята матура?</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">Избери датата, когато ще извършиш изпита.</p>
              </div>
              
              <div className="space-y-6 sm:space-y-8">
                <input
                  type="date"
                  value={examDate}
                  min={today}
                  onChange={(e) => handleExamDateChange(e.target.value)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 border-2 border-slate-300 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none text-base sm:text-lg font-medium transition-all duration-200 hover:border-slate-400"
                />
                
                {daysUntilExam > 0 && (
                  <div className="p-6 sm:p-7 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-50/60 border border-blue-200/60 rounded-2xl shadow-sm">
                    <p className="text-blue-900 font-bold text-lg sm:text-xl">
                      Остават <span className="text-3xl sm:text-4xl text-blue-700">{daysUntilExam}</span> дни до изпита
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* question 2 */}
          {currentStep === 2 && (
            <div className="space-y-8 sm:space-y-10">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">Колко дни в седмицата можеш да учиш?</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">Избери колко дни на седмица можеш да посветиш на учене.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[2, 3, 4, 5].map((days) => (
                  <button
                    key={days}
                    onClick={() => setStudyDaysPerWeek(days)}
                    className={`px-5 sm:px-6 py-4 sm:py-5 rounded-2xl border-2 transition-all duration-200 font-bold text-base sm:text-lg ${
                      studyDaysPerWeek === days
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 scale-105 shadow-md shadow-purple-500/20'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {days} дни
                  </button>
                ))}
                <button
                  onClick={() => setStudyDaysPerWeek(7)}
                  className={`px-5 sm:px-6 py-4 sm:py-5 rounded-2xl border-2 transition-all duration-200 font-bold text-base sm:text-lg ${
                    studyDaysPerWeek === 7
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 scale-105 shadow-md shadow-purple-500/20'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Всеки ден
                </button>
              </div>
            </div>
          )}

          {/* question 3 */}
          {currentStep === 3 && (
            <div className="space-y-8 sm:space-y-10">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">По колко теми на ден искаш да учиш?</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">Избери натоварването, с което се чувстваш комфортно.</p>
              </div>
              
              <div className="space-y-8 sm:space-y-10">
                <div className="px-2 sm:px-4">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={topicsPerDay}
                    onChange={(e) => setTopicsPerDay(parseInt(e.target.value))}
                    className="w-full h-4 sm:h-5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 font-medium">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>Повече</span>
                  </div>
                </div>

                <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-2xl shadow-sm">
                  <p className="text-slate-800 font-bold text-center text-xl sm:text-2xl">
                    {topicsPerDay === 1 && "1 тема на ден"}
                    {topicsPerDay === 2 && "2 теми на ден"}
                    {topicsPerDay === 3 && "3 теми на ден"}
                    {topicsPerDay === 4 && "4+ теми на ден"}
                  </p>
                </div>

                {topicsPerDay >= 3 && (
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-yellow-50 via-yellow-50/80 to-yellow-50/60 border border-yellow-200/60 rounded-2xl shadow-sm">
                    <p className="text-yellow-900 text-sm sm:text-base font-medium leading-relaxed">
                      ⚠️ Избраното натоварване е високо и може да бъде трудно за поддържане.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* question 4 */}
          {currentStep === 4 && (
            <div className="space-y-10 sm:space-y-12">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">Какво е твоето ниво?</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">Оцени своето текущо ниво по всеки предмет.</p>
              </div>
              
              <div className="space-y-8 sm:space-y-10">
                {/* Български език */}
                <div className="space-y-5 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Български език</h3>
                  <div className="grid grid-cols-3 gap-4 sm:gap-5">
                    {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setBelLevel(level)}
                        className={`px-4 sm:px-5 py-4 sm:py-5 rounded-2xl border-2 transition-all duration-200 font-bold text-sm sm:text-base ${
                          belLevel === level
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 scale-105 shadow-md shadow-purple-500/20'
                            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
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
                <div className="space-y-5 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Литература</h3>
                  <div className="grid grid-cols-3 gap-4 sm:gap-5">
                    {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setLiteratureLevel(level)}
                        className={`px-4 sm:px-5 py-4 sm:py-5 rounded-2xl border-2 transition-all duration-200 font-bold text-sm sm:text-base ${
                          literatureLevel === level
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 scale-105 shadow-md shadow-purple-500/20'
                            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
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
          <div className="flex justify-between items-center mt-12 sm:mt-14 md:mt-16 pt-8 sm:pt-10 border-t border-slate-200/80 gap-4 sm:gap-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold text-base sm:text-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              Назад
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 hover:from-pink-400 hover:via-pink-300 hover:to-purple-400 text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Напред
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 hover:from-pink-400 hover:via-pink-300 hover:to-purple-400 text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
