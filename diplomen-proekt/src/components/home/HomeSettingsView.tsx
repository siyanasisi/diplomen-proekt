import type { HomeState } from "./types";

type HomeSettingsViewProps = {
    home: HomeState;
};

export function HomeSettingsView({ home }: HomeSettingsViewProps) {
    const { activeMenu } = home;

    if (activeMenu !== "settings") return null;

    return (
        <div className="space-y-8">
            <div className="mb-10">
                <h2 className="text-5xl font-bold text-slate-800 tracking-tight mb-3 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Настройки</h2>
                <p className="text-lg text-slate-600 font-bold">Персонализирайте вашите настройки</p>
            </div>
            <div className="bg-white rounded-3xl p-12 shadow-lg shadow-slate-900/5 border border-purple-900/20 text-center">
                <div className="w-20 h-20 bg-purple-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Функционалността скоро ще бъде достъпна</h3>
                <p className="text-lg text-slate-500 font-medium">Работим по добавянето на настройки</p>
            </div>
        </div>
    );
}
