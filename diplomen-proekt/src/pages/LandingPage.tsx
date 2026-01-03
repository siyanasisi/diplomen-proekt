import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
            {/* hero section */}
            <div className="min-h-screen flex items-center justify-center px-6 py-16">
                <div className="max-w-6xl w-full">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left side */}
                        <div className="text-center md:text-left">
                            {/* Logo */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 mb-8">
                                <svg 
                                    className="w-10 h-10 text-white" 
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
                                Подготви се за матурата <span className="text-rose-600">умно</span>, не наизуст
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Матура<span className="text-rose-600 font-bold">+</span> е интерактивна платформа за подготовка за държавните зрелостни изпити. 
                                Уроци, таймлайн, тестове и учители на едно място.
                            </p>

                            {/* Button */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/40 focus:outline-none focus:ring-4 focus:ring-rose-600/30 transition-all duration-300 transform hover:scale-105"
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

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/40 focus:outline-none focus:ring-4 focus:ring-rose-600/30 transition-all duration-300 transform hover:scale-105"
                                >
                                    Вход
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

                        <div className="hidden md:block">
                            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
                                <div className="aspect-square bg-gradient-to-br from-rose-100 to-blue-100 rounded-2xl flex items-center justify-center">
                                    <svg className="w-48 h-48 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                        </div>
                    </div>
                </div>
            );
        };
