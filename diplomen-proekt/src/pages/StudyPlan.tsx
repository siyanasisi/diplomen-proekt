import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, ensureValidSession } from "../supabase-client";
import type { StudyPlan as StudyPlanType } from "../lib/topics";
import { StudyPlanCalendar } from "../components/StudyPlanCalendar";

export const StudyPlanPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlanType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (role !== 'student') {
      navigate('/home', { replace: true });
      return;
    }

    loadStudyPlan();
  }, [user, role, navigate]);

  const loadStudyPlan = async () => {
    if (!user) return;

    try {
      await ensureValidSession();

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading study plan:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // transform data from Supabase format to our format
        const transformedPlan: StudyPlanType = {
          id: data.id,
          user_id: data.user_id,
          preferences: {
            examDate: new Date(data.preferences.exam_date),
            studyDaysPerWeek: data.preferences.study_days_per_week,
            topicsPerDay: data.preferences.topics_per_day,
            belLevel: data.preferences.bel_level,
            literatureLevel: data.preferences.literature_level,
          },
          plan: data.plan,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setPlan(transformedPlan);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load study plan:', error);
      setLoading(false);
    }
  };

  const handlePlanUpdate = (updatedPlan: StudyPlanType) => {
    setPlan(updatedPlan);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    navigate('/study-plan/intro', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Моят учебен план</h1>
          <p className="text-slate-600">
            Следвай своя персонализиран план и подготви се за матурата!
          </p>
        </div>

        {/* plan summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-lg">
            <div className="text-sm text-slate-600 mb-1">Дни до изпита</div>
            <div className="text-2xl font-bold text-slate-900">
              {Math.ceil((plan.preferences.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-lg">
            <div className="text-sm text-slate-600 mb-1">Учебни дни</div>
            <div className="text-2xl font-bold text-slate-900">
              {plan.plan.filter(d => !d.completed && !d.missed).length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-lg">
            <div className="text-sm text-slate-600 mb-1">Завършени</div>
            <div className="text-2xl font-bold text-emerald-600">
              {plan.plan.filter(d => d.completed).length}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-lg">
            <div className="text-sm text-slate-600 mb-1">Теми на ден</div>
            <div className="text-2xl font-bold text-slate-900">
              {plan.preferences.topicsPerDay}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 p-6 md:p-8">
          <StudyPlanCalendar plan={plan} onPlanUpdate={handlePlanUpdate} />
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Напомняне:</strong> Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
          </p>
        </div>
      </div>
    </div>
  );
};
