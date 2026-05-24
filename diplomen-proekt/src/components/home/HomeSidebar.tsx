import type { HomeMenuId } from "../../types/home";
import type { DziBelCountdown } from "../../constants/dziBelExam";

export interface HomeMenuItem {
    id: HomeMenuId;
    label: string;
    icon: React.ReactNode;
}

interface HomeSidebarProps {
    menuItems: HomeMenuItem[];
    activeMenu: HomeMenuId;
    setActiveMenu: (id: HomeMenuId) => void;
    isTeacher: boolean;
    eventsCount: number;
    dziBelCountdown?: DziBelCountdown;
    daysUntilExam?: number;
    currentStreak?: number;
    longestStreak?: number;
}

export function HomeSidebar({
    menuItems,
    activeMenu,
    setActiveMenu,
    isTeacher,
    eventsCount,
    dziBelCountdown,
    daysUntilExam: daysUntilExamProp,
    currentStreak = 0,
    longestStreak = 0,
}: HomeSidebarProps) {
    const countdown = dziBelCountdown ?? {
        daysRemaining: Math.max(0, daysUntilExamProp ?? 0),
        hasPassed: false,
        isExamDay: false,
        examDateLabel: '20 май 2027 г.',
    };

    return (
        <aside className="hidden lg:flex w-72 flex-shrink-0 h-screen flex-col bg-white border-r border-slate-200">
            {/* header */}
            <div className="flex-shrink-0 border-b border-slate-100" style={{ padding: '1.5rem' }}>
                <div className="flex items-center" style={{ gap: '0.875rem' }}>
                    <div
                        className="flex items-center justify-center bg-purple-700 text-white"
                        style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', fontSize: '1.25rem' }}
                    >
                        <span className="material-icons" style={{ fontSize: '1.375rem' }}>
                            {isTeacher ? 'school' : 'auto_stories'}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-slate-900" style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                            {isTeacher ? "Учителски панел" : "Ученически панел"}
                        </h1>
                        <p className="text-slate-500" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {isTeacher ? "Преглед на активност" : "Подготовка за изпит"}
                        </p>
                    </div>
                </div>
            </div>

            {/* navigation */}
            <nav
                className="flex-1 overflow-y-auto"
                style={{ padding: '1.25rem 1rem', scrollbarWidth: 'none' }}
            >
                <p className="text-slate-400 uppercase" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.75rem' }}>
                    Навигация
                </p>
                <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                    {menuItems.map((item) => {
                        const isActive = activeMenu === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveMenu(item.id)}
                                className={`group relative w-full flex items-center text-left transition-all ${
                                    isActive
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                                style={{
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.625rem',
                                    fontSize: '0.9375rem',
                                    fontWeight: isActive ? 600 : 500,
                                }}
                            >
                                {isActive && (
                                    <div
                                        className="absolute left-0 bg-purple-700"
                                        style={{ top: '25%', bottom: '25%', width: '3px', borderRadius: '0 4px 4px 0' }}
                                    />
                                )}
                                <span className={isActive ? 'text-purple-700' : 'text-slate-400 group-hover:text-slate-600'} style={{ transition: 'color 0.15s' }}>
                                    {item.icon}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <span className="material-icons text-purple-700" style={{ fontSize: '1.125rem' }}>chevron_right</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* stats footer */}
            <div className="flex-shrink-0 border-t border-slate-100" style={{ padding: '1rem' }}>
                {isTeacher ? (
                    <div
                        className="bg-slate-50 border border-slate-100"
                        style={{ borderRadius: '0.75rem', padding: '1rem' }}
                    >
                        <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span className="material-icons text-purple-700" style={{ fontSize: '1rem' }}>bar_chart</span>
                            <p className="text-slate-600 uppercase" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em' }}>Статистика</p>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-slate-100" style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                            <span className="text-slate-500" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Общо събития</span>
                            <span className="text-purple-700 tabular-nums" style={{ fontSize: '1rem', fontWeight: 700 }}>{eventsCount}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col" style={{ gap: '0.625rem' }}>
                        {/* exam countdown */}
                        <div
                            className={`border ${countdown.hasPassed ? 'bg-slate-50 border-slate-200' : 'bg-purple-50 border-purple-100'}`}
                            style={{ borderRadius: '0.75rem', padding: '1rem' }}
                        >
                            <div className="flex items-center" style={{ gap: '0.375rem', marginBottom: '0.5rem' }}>
                                <span
                                    className={`material-icons ${countdown.hasPassed ? 'text-slate-500' : 'text-purple-700'}`}
                                    style={{ fontSize: '1rem' }}
                                >
                                    {countdown.hasPassed ? 'event_available' : 'timer'}
                                </span>
                                <p
                                    className={`uppercase ${countdown.hasPassed ? 'text-slate-600' : 'text-purple-700'}`}
                                    style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em' }}
                                >
                                    ДЗИ Бел
                                </p>
                            </div>
                            <div className="text-center">
                                {countdown.hasPassed ? (
                                    <>
                                        <p className="text-slate-800" style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
                                            Изпитът мина
                                        </p>
                                        <p className="text-slate-500" style={{ fontSize: '0.6875rem', fontWeight: 500, marginTop: '0.375rem', lineHeight: 1.4 }}>
                                            {countdown.examDateLabel}
                                        </p>
                                    </>
                                ) : countdown.isExamDay ? (
                                    <>
                                        <p className="text-purple-700" style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.2 }}>
                                            Днес е изпитът
                                        </p>
                                        <p className="text-purple-600" style={{ fontSize: '0.6875rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                            ДЗИ Бел · {countdown.examDateLabel}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-purple-700 tabular-nums" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                                            {countdown.daysRemaining}
                                        </p>
                                        <p className="text-purple-600" style={{ fontSize: '0.6875rem', fontWeight: 600, marginTop: '0.125rem' }}>
                                            дни до ДЗИ Бел
                                        </p>
                                        <p className="text-purple-500/90" style={{ fontSize: '0.625rem', fontWeight: 500, marginTop: '0.25rem' }}>
                                            {countdown.examDateLabel}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* streaks */}
                        <div
                            className="bg-slate-50 border border-slate-100"
                            style={{ borderRadius: '0.75rem', padding: '1rem' }}
                        >
                            <div className="flex items-center" style={{ gap: '0.375rem', marginBottom: '0.625rem' }}>
                                <span className="material-icons text-purple-700" style={{ fontSize: '1rem' }}>bar_chart</span>
                                <p className="text-slate-600 uppercase" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em' }}>Статистика</p>
                            </div>
                            <div className="flex flex-col" style={{ gap: '0.375rem' }}>
                                {[
                                    { label: 'Текуща серия', value: `${currentStreak} дни` },
                                    { label: 'Най-дълга', value: `${longestStreak} дни` },
                                    { label: 'Събития', value: `${eventsCount}` },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="flex items-center justify-between bg-white border border-slate-100"
                                        style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}
                                    >
                                        <span className="text-slate-500" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{stat.label}</span>
                                        <span className="text-slate-800 tabular-nums" style={{ fontSize: '0.875rem', fontWeight: 700 }}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
