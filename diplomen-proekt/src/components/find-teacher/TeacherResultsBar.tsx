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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            style={{ gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 0' }}
            role="region"
            aria-label="Резултати и сортиране"
        >
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                Показани {filteredCount} учители
            </div>
            <p className="flex items-center text-slate-600" style={{ gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                <span className="bg-purple-50 text-purple-700" style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.8125rem' }}>
                    {filteredCount}
                </span>
                <span>учители</span>
                {showTotal && (
                    <span className="text-slate-400" style={{ fontSize: '0.8125rem' }}>от общо {totalCount}</span>
                )}
            </p>
            <div className="flex items-center" style={{ gap: '0.625rem' }}>
                <label htmlFor="sort-teachers" className="text-slate-400 shrink-0" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Сортирай:
                </label>
                <select
                    id="sort-teachers"
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as TeacherSortOption)}
                    className="text-slate-700 bg-white border border-slate-200 focus:border-purple-500 outline-none transition-all hover:border-slate-300"
                    style={{ padding: '0.4375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
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
                    className="text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center transition-colors disabled:opacity-50"
                    style={{ gap: '0.375rem', padding: '0.4375rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                    aria-label="Обнови списъка"
                >
                    <span className={`material-icons ${refreshing ? "animate-spin" : ""}`} style={{ fontSize: '1rem' }}>refresh</span>
                    Обнови
                </button>
            </div>
        </div>
    );
}
