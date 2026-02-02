import { useState } from "react";
import { TEACHER_SUBJECTS, RATING_FILTER_OPTIONS, TEACHER_CITIES } from "../../constants/teachers";

interface TeacherFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedSubject: string;
    onSubjectChange: (value: string) => void;
    selectedCity: string;
    onCityChange: (value: string) => void;
    selectedRating: number;
    onRatingChange: (value: number) => void;
    isOnlineOnly: boolean;
    onOnlineOnlyChange: (value: boolean) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

const filterInputClass =
    "w-full min-h-[44px] sm:min-h-[48px] px-4 py-3 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-slate-800 text-base bg-white hover:border-slate-300";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

function ToggleSwitch({
    checked,
    onChange,
    label,
    id,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    id: string;
}) {
    return (
        <label
            htmlFor={id}
            className="flex items-center gap-3 cursor-pointer select-none"
        >
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    checked ? "bg-purple-600" : "bg-slate-200"
                }`}
            >
                <span
                    className={`pointer-events-none absolute top-1 left-1 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </label>
    );
}

export function TeacherFilters({
    searchQuery,
    onSearchChange,
    selectedSubject,
    onSubjectChange,
    selectedCity,
    onCityChange,
    selectedRating,
    onRatingChange,
    isOnlineOnly,
    onOnlineOnlyChange,
    hasActiveFilters,
    onClearFilters,
}: TeacherFiltersProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);

    return (
        <section className="mb-6 sm:mb-8" aria-label="Филтри за учители">
            {/* search bar */}
            <div className="mb-4 sm:mb-5">
                <label htmlFor="teacher-search" className="sr-only">
                    Търсене на учители
                </label>
                <div className="relative">
                    <input
                        id="teacher-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Търсете по име, предмет или описание..."
                        className="w-full min-h-[56px] sm:min-h-[60px] pr-4 py-4 text-slate-800 text-base sm:text-lg placeholder:text-slate-400 rounded-2xl border-2 border-slate-200 bg-white shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 outline-none transition-all hover:border-slate-300"
                        style={{ paddingLeft: "4.25rem" }}
                        autoComplete="off"
                    />
                    <span
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden
                    >
                        <svg
                            className="w-6 h-6 sm:w-7 sm:h-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </span>
                </div>
            </div>

            {/* filters */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 sm:bg-slate-50/90 shadow-sm overflow-hidden">
                {/* toggle filters on mobile */}
                <button
                    type="button"
                    onClick={() => setFiltersOpen((o) => !o)}
                    className="md:hidden w-full flex items-center justify-between gap-2 min-h-[48px] px-4 py-3 text-slate-700 font-medium hover:bg-slate-100/80 transition-colors"
                    aria-expanded={filtersOpen}
                    aria-controls="teacher-filters-panel"
                >
                    <span>Филтри</span>
                    <svg
                        className={`w-5 h-5 text-slate-500 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* filters panel */}
                <div
                    id="teacher-filters-panel"
                    className={`overflow-hidden transition-all duration-200 md:max-h-none ${
                        filtersOpen ? "max-h-[1200px]" : "max-h-0"
                    }`}
                >
                    <div className="p-4 sm:p-5 lg:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            <div>
                                <label className={labelClass}>Предмет</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => onSubjectChange(e.target.value)}
                                    className={filterInputClass}
                                    aria-label="Филтър по предмет"
                                >
                                    <option value="">Всички предмети</option>
                                    {TEACHER_SUBJECTS.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Град / Онлайн</label>
                                <select
                                    value={selectedCity}
                                    onChange={(e) => onCityChange(e.target.value)}
                                    className={filterInputClass}
                                    aria-label="Филтър по град"
                                >
                                    <option value="">Всички локации</option>
                                    <option value="Онлайн">Онлайн</option>
                                    {TEACHER_CITIES.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Минимален рейтинг</label>
                                <select
                                    value={selectedRating}
                                    onChange={(e) => onRatingChange(Number(e.target.value))}
                                    className={filterInputClass}
                                    aria-label="Филтър по рейтинг"
                                >
                                    {RATING_FILTER_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end pb-1">
                                <ToggleSwitch
                                    id="online-only-toggle"
                                    checked={isOnlineOnly}
                                    onChange={onOnlineOnlyChange}
                                    label="Само онлайн"
                                />
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="mt-4 pt-4 border-t border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={onClearFilters}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100/80 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Изчисти филтрите
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
