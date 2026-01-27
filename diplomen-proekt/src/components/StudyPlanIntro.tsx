import { Link } from "react-router-dom";

export const StudyPlanIntro = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-8 lg:p-12">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-8 sm:p-12 md:p-16 text-center">
          {/* main content */}
          <div className="mb-10 sm:mb-12 md:mb-14">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight mb-8 sm:mb-10 md:mb-12">
              <span className="block">Създай своя</span>
              <span className="block">персонален</span>
              <span className="block bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 bg-clip-text text-transparent">учебен план</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време, ниво и цел за матурата.
            </p>
          </div>

          {/* note */}
          <div className="mb-10 sm:mb-12 md:mb-14">
            <div className="p-5 sm:p-6 bg-blue-50 border border-blue-200/60 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-blue-900 font-medium leading-relaxed text-left">
                  <strong className="font-bold">Важно:</strong> Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
                </p>
              </div>
            </div>
          </div>

          {/* cta button */}
          <div>
            <Link
              to="/study-plan/questionnaire"
              className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40 hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 hover:from-pink-400 hover:via-pink-300 hover:to-purple-400 text-white"
            >
              <span>Създай моя план</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
