import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-[#f4f6fa] text-slate-900">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_22%_8%,rgba(124,58,237,0.09),transparent_45%),linear-gradient(#f4f6fa,#f4f6fa)]" />

            <nav className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-5 md:px-10 xl:px-16">
                    <a href="#top" className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-600/30">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="font-display text-[1.9rem] font-extrabold tracking-tight">
                            Matura<span className="text-violet-600">+</span>
                        </span>
                    </a>

                    <div className="hidden items-center gap-4 text-[15px] font-medium text-slate-700 md:flex">
                        <button
                            onClick={() => navigate("/login")}
                            className="inline-flex h-12 min-w-[132px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/70 px-8 text-[15px] font-semibold shadow-[0_8px_18px_-16px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-violet-200 hover:bg-white hover:text-violet-700 hover:shadow-[0_16px_28px_-18px_rgba(15,23,42,0.48)]"
                        >
                            Вход
                        </button>
                        <button
                            onClick={() => navigate("/signup")}
                            className="group relative inline-flex h-12 min-w-[148px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-violet-500 to-violet-600 px-10 text-[14px] font-semibold text-white shadow-[0_12px_24px_-14px_rgba(124,58,237,0.78)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_20px_34px_-16px_rgba(124,58,237,0.9)]"
                        >
                            <span className="pointer-events-none absolute inset-x-4 top-0 h-[52%] rounded-full bg-white/30 blur-sm" />
                            <span className="relative">Старт</span>
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/signup")}
                        className="group relative inline-flex h-11 min-w-[124px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-7 text-[13px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(124,58,237,0.76)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_16px_28px_-14px_rgba(124,58,237,0.86)] md:hidden"
                    >
                        <span className="pointer-events-none absolute inset-x-3 top-0 h-[50%] rounded-full bg-white/30 blur-sm" />
                        <span className="relative">Старт</span>
                    </button>
                </div>
            </nav>

            <section id="top" className="pb-32 pt-28 lg:pb-36 lg:pt-28">
                <div className="mx-auto grid w-full max-w-[1280px] items-start gap-14 px-6 md:px-10 lg:grid-cols-[0.95fr_1.25fr] lg:gap-16 xl:px-16">
                    <div className="relative isolate rounded-[38px] px-7 py-10 sm:px-10 sm:py-12 lg:px-12">
                        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[38px] bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.12),transparent_58%),radial-gradient(circle_at_86%_84%,rgba(124,58,237,0.07),transparent_56%)]" />

                        <div className="mb-4 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
                            Нова версия: БЕЛ + Тестове
                        </div>

                        <div className="max-w-[560px]">
                            <h1 className="max-w-[16ch] font-display text-[clamp(2.8rem,5.1vw,5.2rem)] font-extrabold leading-[1.08] tracking-tight [word-spacing:0.12em] text-slate-950">
                                Подготви се за матурата <span className="italic text-violet-600">умно</span>, не наизуст.
                            </h1>

                            <div className="mt-10 space-y-5">
                                <p className="text-[clamp(1.02rem,1.25vw,1.38rem)] leading-[1.72] text-slate-600">
                                    Платформа, която обединява уроци, тестове и персонален учебен план.
                                </p>
                                <p className="text-[clamp(1.02rem,1.25vw,1.38rem)] leading-[1.72] text-slate-600">
                                    Добави календар и ясен прогрес за твоята успешна матура на едно място.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-wrap gap-4 sm:mt-14">
                            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-3 text-[14px] font-medium text-slate-700 shadow-[0_8px_18px_-15px_rgba(15,23,42,0.35)]">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6v12m-6-6h12" />
                                    </svg>
                                </span>
                                1200+ задачи
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-3 text-[14px] font-medium text-slate-700 shadow-[0_8px_18px_-15px_rgba(15,23,42,0.35)]">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9.663 17h4.673M12 3a6 6 0 016 6c0 2.263-1.154 3.61-2.19 4.82-.828.968-1.56 1.824-1.81 3.18h-4c-.25-1.356-.982-2.212-1.81-3.18C7.154 12.61 6 11.263 6 9a6 6 0 016-6z" />
                                    </svg>
                                </span>
                                Личен план
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-3 text-[14px] font-medium text-slate-700 shadow-[0_8px_18px_-15px_rgba(15,23,42,0.35)]">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                Ясен прогрес
                            </span>
                        </div>

                        <div className="mt-14">
                            <button
                                onClick={() => navigate("/signup")}
                                className="group relative inline-flex h-[64px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-b from-violet-500 to-violet-600 px-12 text-[1rem] font-semibold text-white shadow-[0_14px_28px_-14px_rgba(124,58,237,0.8)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_20px_34px_-14px_rgba(124,58,237,0.9)] sm:w-auto sm:min-w-[220px] sm:px-14"
                            >
                                <span className="pointer-events-none absolute inset-x-6 top-0 h-[54%] rounded-full bg-white/30 blur-sm" />
                                <span className="relative">Започни</span>
                                <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/35 bg-white/20">
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5-5 5M6 12h12" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="relative mx-auto mt-8 w-full max-w-[1080px] pt-24 lg:ml-auto lg:mt-10 lg:pt-32">
                        <div className="pointer-events-none absolute inset-x-8 -bottom-14 h-32 rounded-full bg-violet-300/45 blur-3xl" />
                        <div className="relative rounded-[34px] border-[8px] border-slate-950 bg-white shadow-[0_38px_68px_-34px_rgba(15,23,42,0.48)]">
                            <div className="rounded-t-[24px] border-b border-slate-100 px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                </div>
                            </div>
                            <div className="space-y-8 bg-[radial-gradient(circle_at_86%_14%,rgba(124,58,237,0.08),transparent_46%),linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] px-6 pb-10 pt-7 sm:px-9 sm:pb-12 sm:pt-9">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-display text-[2.5rem] font-extrabold tracking-tight sm:text-[2.8rem]">Твоят план</h3>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Седмичен прогрес</p>
                                        <div className="mt-3 h-3 w-full max-w-[360px] rounded-full bg-slate-200/80">
                                            <div className="h-3 w-[68%] rounded-full bg-gradient-to-r from-violet-500 to-violet-600" />
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-violet-200/80 bg-white/90 px-4 py-3 shadow-[0_18px_30px_-22px_rgba(15,23,42,0.58)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">Streak!</p>
                                        <p className="text-[11px] font-semibold text-slate-700">Тестът е завършен!</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)]">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Solved</p>
                                        <p className="mt-1 text-base font-bold text-slate-900">128 tasks</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)]">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Accuracy</p>
                                        <p className="mt-1 text-base font-bold text-slate-900">84%</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)]">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Sessions</p>
                                        <p className="mt-1 text-base font-bold text-slate-900">5 this week</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-14 rounded-2xl border transition-all ${i === 3 ? "flex items-center justify-center border-violet-500 bg-violet-100 text-[10px] font-black uppercase text-violet-700 shadow-[0_14px_22px_-16px_rgba(124,58,237,0.72)]" : "border-slate-200/70 bg-white/70"}`}
                                        >
                                            {i === 3 ? "Матура" : null}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Today</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">Literature practice</p>
                                        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                            <div className="h-1.5 w-[62%] rounded-full bg-violet-500" />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Next up</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">Mock exam, 18:00</p>
                                        <p className="mt-2 text-xs text-slate-500">45 min focus block</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">AI insight</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">Reading speed +12%</p>
                                        <p className="mt-2 text-xs text-slate-500">Best window: 16:30 - 18:30</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-10 left-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_28px_-14px_rgba(15,23,42,0.35)]">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m0 14v2m7-9h2M3 12H1m15.364 6.364l1.414 1.414M6.222 6.222L4.808 4.808m0 14.97l1.414-1.414m11.142-11.142l1.414-1.414M16 12a4 4 0 11-8 0c0-1.105.448-2.105 1.172-2.828C9.896 8.448 10.895 8 12 8s2.104.448 2.828 1.172A3.99 3.99 0 0116 12z" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-[11px] font-bold leading-tight text-slate-800">12 Дни Streak</p>
                                <p className="text-[10px] leading-tight text-slate-500">Продължавай така!</p>
                            </div>
                        </div>
                        <div className="absolute -right-2 top-16 hidden items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/95 px-4 py-3 shadow-[0_18px_30px_-18px_rgba(124,58,237,0.52)] md:flex">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">Smart mode</p>
                                <p className="text-xs font-semibold text-slate-700">3 recommendations ready</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

