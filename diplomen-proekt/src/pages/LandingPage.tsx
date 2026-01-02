import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 px-6">
            <div className="max-w-3xl text-center">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 mb-8">
                    <svg 
                        className="w-12 h-12 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                        />
                    </svg>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                    Матура<span className="text-rose-600">+</span>
                </h1>

                <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Подготви се за матурата умно, не наизуст. Интерактивна платформа за цялостна подготовка за държавните зрелостни изпити.
                </p>

                <button
                    onClick={() => navigate('/signup')}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/40 focus:outline-none focus:ring-4 focus:ring-rose-600/30 transition-all duration-300 transform hover:scale-105 text-lg"
                >
                    Започни сега
                    <svg 
                        className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};