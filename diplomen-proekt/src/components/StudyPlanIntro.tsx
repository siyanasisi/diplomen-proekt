import { Link } from "react-router-dom";

export const StudyPlanIntro = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10 flex items-center justify-center p-4 overflow-y-auto py-8">
      <div className="max-w-2xl w-full my-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Създай своя персонален учебен план
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време, ниво и цел за матурата.
            </p>
          </div>

          <div className="mt-8 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Важно:</strong> Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
            </p>
          </div>

          <Link
            to="/study-plan/questionnaire"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-200 hover:scale-105 active:scale-100"
          >
            <span>Създай моя план</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};
