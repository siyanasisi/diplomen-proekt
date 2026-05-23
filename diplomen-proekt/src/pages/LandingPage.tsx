import { Link, useNavigate } from "react-router-dom";
import { useBrandLinkTarget } from "../hooks/useBrandLinkTarget";

export const LandingPage = () => {
    const navigate = useNavigate();
    const brandLinkTarget = useBrandLinkTarget();

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen">
            {/* navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-6xl mx-auto flex items-center justify-between" style={{ padding: '0 1.5rem', height: '4rem' }}>
                    <Link
                        to={brandLinkTarget}
                        className="flex items-center no-underline hover:opacity-90 transition-opacity"
                        style={{ gap: '0.5rem' }}
                    >
                        <div className="flex items-center justify-center bg-purple-700 text-white" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem' }}>
                            <span className="material-icons" style={{ fontSize: '1.25rem' }}>auto_stories</span>
                        </div>
                        <span className="text-slate-900" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Matura<span className="text-purple-700">+</span>
                        </span>
                    </Link>
                    <div className="flex items-center" style={{ gap: '1.25rem' }}>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                            style={{ fontSize: '0.875rem', fontWeight: 600 }}
                        >
                            Вход
                        </button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer transition-colors"
                            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}
                        >
                            Регистрация
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative overflow-hidden">
                {/* subtle bg accent */}
                <div className="pointer-events-none absolute top-0 right-0 opacity-30" style={{ width: '40%', height: '100%', background: 'radial-gradient(ellipse at top right, rgba(126,34,206,0.06), transparent 70%)' }} />

                {/* Hero */}
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 items-center" style={{ padding: '3rem 1.5rem 4rem', gap: '3rem' }}>
                    {/* left */}
                    <div style={{ maxWidth: '32rem' }}>
                        <div className="inline-flex items-center bg-purple-50 border border-purple-100 text-purple-700" style={{ gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '2rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                            <span className="material-icons" style={{ fontSize: '0.875rem' }}>bolt</span>
                            Нова Версия: БЕЛ + Тестове
                        </div>

                        <h1 className="text-slate-900" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
                            Подготви се за матурата{" "}
                            <span className="gradient-text">умно</span>, не наизуст.
                        </h1>

                        <p className="text-slate-600" style={{ fontSize: '1.0625rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '28rem' }}>
                            Платформа, която обединява уроци, тестове и персонален учебен план.
                            Добави календар и ясен прогрес за твоята успешна матура на едно място.
                        </p>

                        <div className="flex flex-wrap" style={{ gap: '0.5rem', marginBottom: '2rem' }}>
                            {['1200+ задачи', 'Личен план', 'Ясен прогрес'].map((text) => (
                                <div key={text} className="flex items-center bg-white border border-slate-200 text-slate-600" style={{ gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '2rem', fontSize: '0.8125rem', fontWeight: 500 }}>
                                    <span className="material-icons text-purple-700" style={{ fontSize: '0.9375rem' }}>check_circle</span>
                                    {text}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center" style={{ gap: '1.25rem' }}>
                            <button
                                onClick={() => navigate("/signup")}
                                className="bg-purple-700 hover:bg-purple-800 text-white flex items-center group cursor-pointer transition-colors"
                                style={{ padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontSize: '1.0625rem', fontWeight: 700, gap: '0.5rem' }}
                            >
                                Започни
                                <span className="material-icons group-hover:translate-x-0.5 transition-transform" style={{ fontSize: '1.25rem' }}>arrow_forward</span>
                            </button>
                            <div className="flex -space-x-2">
                                {[
                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBbEim12V0I7Or4rcJRw71YhQuKnzGqKNofU7TBo9tTq5KgIldHN2IXQPcXmYQ2EnJwCQpOLC_RkI9e9gQLeOiX0kbfdvaNnblMn8qi3ParH6mkmwh-Kih2ldh38c74vxddNkOiayai8D_f-c3k4gl4i_qfrHQglWZI7BQvg8-0ohIrzw_IcyiG56hPaGItDBnTXS7a_xN_moO8haRSXCvWdm1X8rEgTdWw4aH9FyE8j6mWe9d9f9q3HYK0zAdG8VDDhmPiJTuGzKON",
                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDwweeuVcx3o74dLqLtau3M_tkF8JTC0jsxL9amO4TxyGLQsg_JqSJ4-JIsMnKlGFqWDXQ2Psb8MpQjj4W6Z5NDUs8FEx8kPa0LEp-XYTMzwt_BM3BxG_gW2xw60go8VnNx2A3OlosZ7vD075ZDRosrZlLrKqGCQ5H0q3n_iUgpuJYCsGuAdhgfXLOjLv3ppTjDU_rLLdKsE5TPX2e7ArChRr04-IGnYEntY8KI_s3OWvNlmQsU3_V-BxLmtM6n3l860Y_I-tmD9F7b",
                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCfIsr0_An2-LOwEIJuKBGcyqKuMjthO3mWhHdkUeHOSjTsWLAn8BKpx1-dqJDiMt_lkEo1dP3gr-TdQu5gNJgCKBptblCFNUOJWiJkqs8_h3PmTqReutE6fGbBmEte5PM5HJ1aJ5YRUy6ioE4hUGAJ26eJvoVs1yXPR3ZpSVp98qUixUG1eAzcaQemQS4hGPwh0035IdTh8kBFF_iVEsvhb4blD2j9xTbXj1o9ZR60f_QeOs8n-WeVWfGMgBzkzYwmhpoUXRSevovk",
                                ].map((src, i) => (
                                    <img key={i} alt="Student" className="inline-block ring-2 ring-white object-cover" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%' }} src={src} />
                                ))}
                                <div className="flex items-center justify-center ring-2 ring-white bg-slate-100 text-slate-600" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', fontSize: '0.625rem', fontWeight: 700 }}>+2k</div>
                            </div>
                        </div>
                    </div>

                    {/* right - dashboard mockup */}
                    <div className="relative hidden lg:block">
                        <div className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: '1rem', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.1)' }}>
                            {/* browser chrome */}
                            <div className="flex items-center border-b border-slate-100" style={{ height: '2.25rem', padding: '0 1rem', gap: '0.375rem' }}>
                                <div className="bg-rose-400" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%' }} />
                                <div className="bg-amber-400" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%' }} />
                                <div className="bg-emerald-400" style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%' }} />
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                {/* header */}
                                <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 className="text-slate-900" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Твоят план</h2>
                                        <p className="text-slate-400 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', marginTop: '0.375rem' }}>Седмичен прогрес</p>
                                        <div className="bg-slate-100 overflow-hidden" style={{ width: '10rem', height: '0.375rem', borderRadius: '0.25rem', marginTop: '0.375rem' }}>
                                            <div className="bg-purple-700 h-full" style={{ width: '66%' }} />
                                        </div>
                                    </div>
                                    <div className="flex" style={{ gap: '0.5rem' }}>
                                        <div className="bg-purple-50 border border-purple-100" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
                                            <span className="text-purple-700" style={{ fontSize: '0.5625rem', fontWeight: 700, display: 'block' }}>ПОРЕДИЦА!</span>
                                            <span className="text-slate-500" style={{ fontSize: '0.5625rem' }}>Тестът е завършен!</span>
                                        </div>
                                        <div className="bg-purple-50 flex items-center" style={{ padding: '0.5rem', borderRadius: '0.5rem', gap: '0.375rem' }}>
                                            <div className="flex items-center justify-center bg-purple-700 text-white" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%' }}>
                                                <span className="material-icons" style={{ fontSize: '0.75rem' }}>bolt</span>
                                            </div>
                                            <div>
                                                <p className="text-purple-700" style={{ fontSize: '0.5625rem', fontWeight: 700 }}>УМЕН РЕЖИМ</p>
                                                <p className="text-slate-500" style={{ fontSize: '0.5625rem' }}>3 препоръки</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* stats */}
                                <div className="grid grid-cols-3" style={{ gap: '0.625rem', marginBottom: '1.25rem' }}>
                                    {[['РЕШЕНИ', '128 задачи'], ['ТОЧНОСТ', '84%'], ['СЕСИИ', '5 тази седмица']].map(([label, value]) => (
                                        <div key={label} className="bg-slate-50 border border-slate-100" style={{ padding: '0.75rem', borderRadius: '0.625rem' }}>
                                            <p className="text-slate-400 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</p>
                                            <p className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.125rem' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* calendar */}
                                <div className="flex overflow-hidden" style={{ gap: '0.375rem', marginBottom: '1.25rem' }}>
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="bg-white border border-slate-100" style={{ minWidth: '3rem', height: '2.75rem', borderRadius: '0.5rem' }} />
                                    ))}
                                    <div className="flex items-center justify-center border-2 border-purple-700 bg-purple-50" style={{ minWidth: '4rem', height: '2.75rem', borderRadius: '0.5rem' }}>
                                        <span className="text-purple-700" style={{ fontSize: '0.625rem', fontWeight: 700 }}>МАТУРА</span>
                                    </div>
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={`r-${i}`} className="bg-white border border-slate-100" style={{ minWidth: '3rem', height: '2.75rem', borderRadius: '0.5rem' }} />
                                    ))}
                                </div>

                                {/* schedule */}
                                <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                                    {[
                                        ['ДНЕС', 'Практика по литература', ''],
                                        ['СЛЕДВАЩО', 'Пробен изпит, 18:00', '45 мин фокус блок'],
                                        ['AI АНАЛИЗ', 'Скорост на четене +12%', 'Най-добър прозорец: 16-18ч'],
                                    ].map(([label, title, sub]) => (
                                        <div key={label}>
                                            <p className="text-slate-400 uppercase" style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</p>
                                            <p className="text-slate-900" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{title}</p>
                                            {sub && <p className="text-slate-500" style={{ fontSize: '0.5625rem', marginTop: '0.125rem' }}>{sub}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* floating badge */}
                        <div className="absolute bg-white border border-slate-200 flex items-center" style={{ bottom: '-1rem', left: '-1rem', padding: '0.75rem', borderRadius: '0.75rem', gap: '0.625rem', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }}>
                            <div className="flex items-center justify-center bg-amber-50" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%' }}>
                                <span className="material-icons text-amber-500" style={{ fontSize: '1.125rem' }}>wb_sunny</span>
                            </div>
                            <div>
                                <p className="text-slate-900" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>12 Дни Поредица</p>
                                <p className="text-slate-500" style={{ fontSize: '0.625rem' }}>Продължавай така!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
