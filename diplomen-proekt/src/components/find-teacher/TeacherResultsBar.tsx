import type { TeacherSortOption } from "../../types/teacher";
import { SORT_OPTIONS } from "../../constants/teachers";

interface TeacherResultsBarProps {
    filteredCount: number;
    totalCount: number;
    sortBy: TeacherSortOption;
    onSortChange: (value: TeacherSortOption) => void;
    onRefresh: () => void;
    refreshing: boolean;
}

export function TeacherResultsBar({
    filteredCount,
    totalCount,
    sortBy,
    onSortChange,
    onRefresh,
    refreshing,
}: TeacherResultsBarProps) {
    const showTotal = totalCount > 0 && filteredCount !== totalCount;

    return (
        <div
            className="sticky top-16 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 py-3 -mx-1 px-1 rounded-xl bg-gradient-to-b from-slate-50 to-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            role="region"
            aria-label="Резултати и сортиране"
        >
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                Показани {filteredCount} учители
            </div>
            <p className="text-sm font-medium text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-0 justify-center px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold">
                    {filteredCount}
                </span>
                <span>учители</span>
                {showTotal && (
                    <span className="text-slate-500 text-sm">от общо {totalCount}</span>
                )}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <label htmlFor="sort-teachers" className="text-sm font-medium text-slate-600 sm:mr-2 shrink-0">
                    Сортирай по:
                </label>
                <select
                    id="sort-teachers"
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as TeacherSortOption)}
                    className="min-h-[44px] sm:min-h-[40px] w-full sm:w-auto sm:min-w-[160px] px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    aria-label="Сортиране на резултати"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none touch-manipulation"
                    aria-label="Обнови списъка"
                >
                    <svg
                        className={`w-5 h-5 flex-shrink-0 ${refreshing ? "animate-spin" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Обнови</span>
                </button>
            </div>
        </div>
    );
}
