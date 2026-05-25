import { Link } from "react-router-dom";

export const StudyPlanIntro = () => {
  return (
    <div className="min-h-full bg-slate-50 relative">
      {/* bg accent */}
      <div
        className="pointer-events-none fixed top-0 right-0 -z-10 opacity-40"
        style={{ width: '33%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.05), transparent)' }}
      />

      <main
        style={{
          maxWidth: '48rem',
          padding: '4rem 1.5rem 5rem',
          marginLeft: 'clamp(2rem, 12vw, 16rem)',
          marginRight: 'auto',
        }}
      >
        <div
          className="bg-white border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ borderRadius: '1rem', padding: '2.5rem 2rem' }}
        >
          {/* heading */}
          <h1
            className="font-extrabold text-slate-900 leading-tight"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', marginBottom: '1rem' }}
          >
            Създай своя персонален{' '}
            <span className="text-purple-700">учебен план</span>
          </h1>

          <p className="text-slate-500" style={{ fontSize: '1.1rem', lineHeight: '1.65', maxWidth: '34rem', marginBottom: '2rem' }}>
            Отговори на няколко кратки въпроса и ще създадем учебен план, съобразен с твоето време, ниво и цел за матурата.
          </p>

          {/* info card */}
          <div
            className="bg-purple-50 border border-purple-100 flex items-start"
            style={{ padding: '1.125rem 1.25rem', borderRadius: '0.875rem', gap: '0.875rem', marginBottom: '2.5rem' }}
          >
            <span className="material-icons text-purple-700 shrink-0" style={{ fontSize: '1.375rem', marginTop: '0.0625rem' }}>info</span>
            <p className="text-purple-900" style={{ fontSize: '0.925rem', lineHeight: '1.55' }}>
              <strong className="font-bold">Важно:</strong> Всяка тема включва учене и преговор, затова няма отделни дни само за преговор.
            </p>
          </div>

          {/* CTA */}
          <Link
            to="/study-plan/questionnaire"
            className="bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-all duration-200 shadow-md shadow-purple-700/20 hover:shadow-lg hover:shadow-purple-800/25 inline-flex items-center"
            style={{ height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', fontSize: '0.95rem', gap: '0.5rem' }}
          >
            Създай моя план
            <span className="material-icons" style={{ fontSize: '1.125rem' }}>arrow_forward</span>
          </Link>
        </div>
      </main>
    </div>
  );
};
