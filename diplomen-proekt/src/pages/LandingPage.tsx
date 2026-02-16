import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white text-slate-900 transition-colors duration-300">
            {/* navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-icons text-white">auto_stories</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight">
                            Matura<span className="text-primary">+</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate("/login")}
                            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors cursor-pointer"
                        >
                            Вход
                        </button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="px-6 py-2.5 bg-primary hover:bg-secondary text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            Старт
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative overflow-hidden">
                <div className="hero-glow" />

                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-16 items-center">
                    {/* left column */}
                    <div style={{ marginLeft: "4rem" }} className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <span className="material-icons text-sm">bolt</span>
                            <span className="text-xs font-bold uppercase tracking-wider">
                                Нова Версия: БЕЛ + Тестове
                            </span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                            Подготви се за матурата{" "}
                            <span className="gradient-text">умно</span>, не наизуст.
                        </h1>

                        <p style={{ marginTop: "2rem", marginBottom: "2rem" }} className="text-lg text-slate-600 max-w-xl leading-relaxed">
                            Платформа, която обединява уроци, тестове и персонален учебен план.
                            Добави календар и ясен прогрес за твоята успешна матура на едно
                            място.
                        </p>

                        <div style={{ marginBottom: "2rem" }} className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <span className="material-icons text-primary text-base">
                                    check_circle
                                </span>
                                1200+ задачи
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <span className="material-icons text-primary text-base">
                                    check_circle
                                </span>
                                Личен план
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <span className="material-icons text-primary text-base">
                                    check_circle
                                </span>
                                Ясен прогрес
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <button
                                onClick={() => navigate("/signup")}
                                className="px-8 py-4 bg-primary hover:bg-secondary text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group cursor-pointer"
                            >
                                Започни
                                <span className="material-icons group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </button>
                            <div className="flex -space-x-3 overflow-hidden">
                                <img
                                    alt="Student user"
                                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbEim12V0I7Or4rcJRw71YhQuKnzGqKNofU7TBo9tTq5KgIldHN2IXQPcXmYQ2EnJwCQpOLC_RkI9e9gQLeOiX0kbfdvaNnblMn8qi3ParH6mkmwh-Kih2ldh38c74vxddNkOiayai8D_f-c3k4gl4i_qfrHQglWZI7BQvg8-0ohIrzw_IcyiG56hPaGItDBnTXS7a_xN_moO8haRSXCvWdm1X8rEgTdWw4aH9FyE8j6mWe9d9f9q3HYK0zAdG8VDDhmPiJTuGzKON"
                                />
                                <img
                                    alt="Student user"
                                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwweeuVcx3o74dLqLtau3M_tkF8JTC0jsxL9amO4TxyGLQsg_JqSJ4-JIsMnKlGFqWDXQ2Psb8MpQjj4W6Z5NDUs8FEx8kPa0LEp-XYTMzwt_BM3BxG_gW2xw60go8VnNx2A3OlosZ7vD075ZDRosrZlLrKqGCQ5H0q3n_iUgpuJYCsGuAdhgfXLOjLv3ppTjDU_rLLdKsE5TPX2e7ArChRr04-IGnYEntY8KI_s3OWvNlmQsU3_V-BxLmtM6n3l860Y_I-tmD9F7b"
                                />
                                <img
                                    alt="Student user"
                                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfIsr0_An2-LOwEIJuKBGcyqKuMjthO3mWhHdkUeHOSjTsWLAn8BKpx1-dqJDiMt_lkEo1dP3gr-TdQu5gNJgCKBptblCFNUOJWiJkqs8_h3PmTqReutE6fGbBmEte5PM5HJ1aJ5YRUy6ioE4hUGAJ26eJvoVs1yXPR3ZpSVp98qUixUG1eAzcaQemQS4hGPwh0035IdTh8kBFF_iVEsvhb4blD2j9xTbXj1o9ZR60f_QeOs8n-WeVWfGMgBzkzYwmhpoUXRSevovk"
                                />
                                <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-bold">
                                    +2k
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* right column - dashboard mockup */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-purple-400/20 blur-2xl rounded-[3rem] -z-10" />
                        <div className="bg-white rounded-[2rem] border border-slate-200 dashboard-mockup overflow-hidden">
                            {/* browser chrome */}
                            <div className="h-10 border-b border-slate-100 flex items-center px-6 gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>

                            {/* dashboard content */}
                            <div className="p-8">
                                {/* plan header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-800">
                                            Твоят план
                                        </h2>
                                        <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">
                                            Седмичен прогрес
                                        </p>
                                        <div className="w-48 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-primary w-2/3" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-primary tracking-wider">
                                                    ПОРЕДИЦА!
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Тестът е завършен!
                                            </span>
                                        </div>
                                        <div className="bg-primary/10 p-3 rounded-xl flex items-center gap-2">
                                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                <span className="material-icons text-white text-[14px]">
                                                    bolt
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-primary">
                                                    УМЕН РЕЖИМ
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    3 препоръки готови
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* stats grid */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            РЕШЕНИ
                                        </p>
                                        <p className="text-xl font-bold">128 задачи</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            ТОЧНОСТ
                                        </p>
                                        <p className="text-xl font-bold">84%</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            СЕСИИ
                                        </p>
                                        <p className="text-xl font-bold">5 тази седмица</p>
                                    </div>
                                </div>

                                {/* calendar row */}
                                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                    <div className="min-w-[80px] h-14 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">
                                            МАТУРА
                                        </span>
                                    </div>
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                    <div className="min-w-[60px] h-14 rounded-xl border border-slate-100 bg-white" />
                                </div>

                                {/* schedule grid */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                                            ДНЕС
                                        </p>
                                        <p className="text-sm font-bold border-b-2 border-primary inline-block pb-0.5">
                                            Практика по литература
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                                            СЛЕДВАЩО
                                        </p>
                                        <p className="text-sm font-bold">Пробен изпит, 18:00</p>
                                        <p className="text-[10px] text-slate-500">
                                            45 мин фокус блок
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                                            AI АНАЛИЗ
                                        </p>
                                        <p className="text-sm font-bold">
                                            Скорост на четене +12%
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            Най-добър прозорец: 16:30 - 18:30
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* floating streak badge */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <span className="material-icons text-amber-500">
                                    wb_sunny
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold">12 Дни Поредица</p>
                                <p className="text-[10px] text-slate-500">
                                    Продължавай така!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};
