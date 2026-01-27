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
            className="relative inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-2xl font-black text-base sm:text-lg md:text-xl transition-all duration-300 ease-out shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:-translate-y-1 hover:scale-105 active:scale-100 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 text-white ring-4 ring-purple-300/50 hover:ring-purple-300/80 overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative z-10">Създай моя план</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};
