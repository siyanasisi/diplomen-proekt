import { useState, useEffect } from "react";
import type { StudyPlan, StudyDay } from "../lib/topics";
import { supabase, ensureValidSession } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { rescheduleMissedDay } from "../lib/studyPlanGenerator";

interface StudyPlanCalendarProps {
  plan: StudyPlan;
  onPlanUpdate: (updatedPlan: StudyPlan) => void;
}

export const StudyPlanCalendar = ({ plan, onPlanUpdate }: StudyPlanCalendarProps) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<StudyDay | null>(null);

  const monthNames = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
  const dayNames = ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const getStudyDayForDate = (day: number): StudyDay | undefined => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return plan.plan.find(d => d.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleMarkMissed = async (day: StudyDay) => {
    if (!user || !confirm('Сигурни ли сте, че искате да маркирате този ден като пропускан? Темите ще бъдат пренасрочени.')) {
      return;
    }

    try {
      await ensureValidSession();

      const updatedPlan = rescheduleMissedDay(plan, day.date);

      // update in supabase
      const { error } = await supabase
        .from('study_plans')
        .update({
          plan: updatedPlan.plan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('id', plan.id);

      if (error) {
        console.error('Error updating plan:', error);
        alert('Възникна грешка при актуализирането на плана.');
        return;
      }

      onPlanUpdate(updatedPlan);
      setSelectedDay(null);
    } catch (error) {
      console.error('Failed to mark day as missed:', error);
      alert('Възникна грешка. Моля, опитайте отново.');
    }
  };

  const handleMarkCompleted = async (day: StudyDay) => {
    if (!user) return;

    try {
      await ensureValidSession();

      const updatedPlan = {
        ...plan,
        plan: plan.plan.map(d =>
          d.date === day.date ? { ...d, completed: !d.completed } : d
        ),
      };

      const { error } = await supabase
        .from('study_plans')
        .update({
          plan: updatedPlan.plan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('id', plan.id);

      if (error) {
        console.error('Error updating plan:', error);
        alert('Възникна грешка при актуализирането на плана.');
        return;
      }

      onPlanUpdate(updatedPlan);
      setSelectedDay(null);
    } catch (error) {
      console.error('Failed to mark day as completed:', error);
      alert('Възникна грешка. Моля, опитайте отново.');
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // lock body scroll when modal is open
  useEffect(() => {
    if (selectedDay) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [selectedDay]);

  return (
    <div className="space-y-6">
      {/* calendar header */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Днес
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* calendar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square border-r border-b border-slate-100"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const studyDay = getStudyDayForDate(day);
            const isToday = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === todayStr;
            const isPast = studyDay && new Date(studyDay.date) < new Date(todayStr);

            return (
              <div
                key={day}
                onClick={() => studyDay && setSelectedDay(studyDay)}
                className={`aspect-square border-r border-b border-slate-100 p-2 cursor-pointer transition-colors ${
                  studyDay
                    ? studyDay.completed
                      ? 'bg-emerald-50 hover:bg-emerald-100'
                      : studyDay.missed
                      ? 'bg-red-50 hover:bg-red-100'
                      : isPast
                      ? 'bg-yellow-50 hover:bg-yellow-100'
                      : 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-slate-50'
                } ${isToday ? 'ring-2 ring-rose-500' : ''}`}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-semibold ${isToday ? 'text-rose-600' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  {studyDay && studyDay.topics.length > 0 && (
                    <div className="flex-1 flex flex-col gap-1 mt-1">
                      {studyDay.topics.slice(0, 2).map((topic, idx) => (
                        <div
                          key={idx}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                            topic.subject === 'Български език'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                          title={topic.name}
                        >
                          {topic.subject}: {topic.name}
                        </div>
                      ))}
                      {studyDay.topics.length > 2 && (
                        <div className="text-[10px] text-slate-500">
                          +{studyDay.topics.length - 2} повече
                        </div>
                      )}
                    </div>
                  )}
                  {studyDay && studyDay.completed && (
                    <div className="mt-auto text-emerald-600 text-xs">
                      ✓
                    </div>
                  )}
                  {studyDay && studyDay.missed && (
                    <div className="mt-auto text-red-600 text-xs">
                      ✗
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
          <span>Предстоящ ден</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
          <span>Пропуснат ден</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded"></div>
          <span>Завършен ден</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span>Маркиран като пропуснат</span>
        </div>
      </div>

      {/* selected day modal */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" 
          onClick={() => setSelectedDay(null)}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-slate-900">
                {new Date(selectedDay.date).toLocaleDateString('bg-BG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {selectedDay.topics.length > 0 ? (
                selectedDay.topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      topic.subject === 'Български език'
                        ? 'border-purple-200 bg-purple-50'
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          topic.subject === 'Български език'
                            ? 'bg-purple-200 text-purple-700'
                            : 'bg-orange-200 text-orange-700'
                        }`}>
                          {topic.subject}
                        </span>
                        <h4 className="mt-2 font-semibold text-slate-900">{topic.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Включва учене и преговор
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Няма теми за този ден</p>
              )}
            </div>

            <div className="flex gap-3">
              {!selectedDay.missed && (
                <button
                  onClick={() => handleMarkMissed(selectedDay)}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Маркирай като пропуснат
                </button>
              )}
              {!selectedDay.missed && (
                <button
                  onClick={() => handleMarkCompleted(selectedDay)}
                  className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-colors ${
                    selectedDay.completed
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {selectedDay.completed ? 'Маркирай като незавършен' : 'Завърши деня'}
                </button>
              )}
              {selectedDay.topics.length > 0 && (
                <button
                  onClick={() => {
                    // navigate to study page
                    window.location.href = `/study?date=${selectedDay.date}`;
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Започни учене
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
