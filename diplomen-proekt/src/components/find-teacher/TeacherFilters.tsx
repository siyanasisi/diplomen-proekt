import { useState, useRef, useEffect } from "react";
import { TEACHER_SUBJECTS, RATING_FILTER_OPTIONS, TEACHER_CITIES } from "../../constants/teachers";
import type { ActiveFilterChip } from "../../hooks/useTeacherFilters";

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
    activeFiltersCount: number;
    activeFilterChips: ActiveFilterChip[];
    onClearFilters: () => void;
}

const selectClass =
    "w-full text-slate-700 bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all hover:border-slate-300 hover:bg-white";
const selectStyle = { padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 500 as const };

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
            className="flex items-center cursor-pointer select-none"
            style={{ gap: '0.625rem' }}
        >
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    checked ? "bg-purple-700" : "bg-slate-200"
                }`}
                style={{ width: '2.75rem', height: '1.5rem', borderRadius: '0.75rem' }}
            >
                <span
                    className="pointer-events-none absolute bg-white shadow-sm transition-transform"
                    style={{ top: '0.1875rem', left: '0.1875rem', width: '1.125rem', height: '1.125rem', borderRadius: '50%', transform: checked ? 'translateX(1.25rem)' : 'translateX(0)' }}
                />
            </button>
            <span className="text-slate-700" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
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
    activeFiltersCount,
    activeFilterChips,
    onClearFilters,
}: TeacherFiltersProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const firstFilterRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (filtersOpen && panelRef.current && window.matchMedia("(max-width: 767px)").matches) {
            panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [filtersOpen]);

    useEffect(() => {
        if (filtersOpen) {
            firstFilterRef.current?.focus({ preventScroll: true });
        }
    }, [filtersOpen]);

    return (
        <section style={{ marginBottom: '1.25rem' }} aria-label="Филтри за учители">
            {/* unified search + filters card */}
            <div className="bg-white border border-slate-200 overflow-hidden" style={{ borderRadius: '1rem' }}>
                {/* search bar integrated into card */}
                <div style={{ padding: '1.25rem 1.25rem 0' }}>
                    <label htmlFor="teacher-search" className="sr-only">
                        Търсене на учители
                    </label>
                    <div className="relative">
                        <span
                            className="pointer-events-none absolute flex items-center justify-center text-purple-500"
                            style={{ left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '2rem', height: '2rem', background: '#faf5ff', borderRadius: '0.5rem' }}
                            aria-hidden
                        >
                            <span className="material-icons" style={{ fontSize: '1.125rem' }}>search</span>
                        </span>
                        <input
                            id="teacher-search"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Търсете по име, предмет или описание..."
                            className="w-full text-slate-800 bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/15 focus:bg-white outline-none transition-all hover:border-slate-300 hover:bg-white"
                            style={{ paddingLeft: '3.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', borderRadius: '0.75rem', fontSize: '0.9375rem' }}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* toggle filters on mobile */}
                <button
                    type="button"
                    onClick={() => setFiltersOpen((o) => !o)}
                    className="md:hidden w-full flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ padding: '0.875rem 1.25rem', fontSize: '0.9375rem', fontWeight: 600 }}
                    aria-expanded={filtersOpen}
                    aria-controls="teacher-filters-panel"
                >
                    <span className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span className="material-icons text-slate-400" style={{ fontSize: '1.125rem' }}>tune</span>
                        Филтри
                        {activeFiltersCount > 0 && (
                            <span className="bg-purple-700 text-white flex items-center justify-center" style={{ minWidth: '1.25rem', height: '1.25rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 700, padding: '0 0.25rem' }}>
                                {activeFiltersCount}
                            </span>
                        )}
                    </span>
                    <span className={`material-icons text-slate-400 transition-transform ${filtersOpen ? "rotate-180" : ""}`} style={{ fontSize: '1.25rem' }}>expand_more</span>
                </button>

                {/* filters panel */}
                <div
                    ref={panelRef}
                    id="teacher-filters-panel"
                    className={`overflow-hidden transition-all duration-200 md:max-h-none ${
                        filtersOpen ? "max-h-[1200px]" : "max-h-0"
                    }`}
                >
                    <div style={{ padding: '1rem 1.25rem 1.25rem' }} role="group" aria-label="Настройки на филтри">
                        <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.875rem' }}>
                            <span className="flex items-center justify-center text-slate-400" style={{ width: '1.5rem', height: '1.5rem' }}>
                                <span className="material-icons" style={{ fontSize: '1rem' }}>tune</span>
                            </span>
                            <span className="text-slate-400 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em' }}>Филтри</span>
                            <span className="flex-1 bg-slate-100" style={{ height: '1px' }} aria-hidden />
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={onClearFilters}
                                    className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 inline-flex items-center transition-colors"
                                    style={{ gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    <span className="material-icons" style={{ fontSize: '0.75rem' }}>close</span>
                                    Изчисти
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '0.875rem' }}>
                            <div>
                                <label className="text-slate-500 block" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.01em' }} htmlFor="filter-subject">
                                    Предмет
                                </label>
                                <select
                                    ref={firstFilterRef}
                                    id="filter-subject"
                                    value={selectedSubject}
                                    onChange={(e) => onSubjectChange(e.target.value)}
                                    className={selectClass}
                                    style={selectStyle}
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
                                <label className="text-slate-500 block" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.01em' }}>Град / Онлайн</label>
                                <select
                                    value={selectedCity}
                                    onChange={(e) => onCityChange(e.target.value)}
                                    className={selectClass}
                                    style={selectStyle}
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
                                <label className="text-slate-500 block" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.01em' }} htmlFor="filter-rating">
                                    Минимален рейтинг
                                </label>
                                <select
                                    id="filter-rating"
                                    value={selectedRating}
                                    onChange={(e) => onRatingChange(Number(e.target.value))}
                                    className={selectClass}
                                    style={selectStyle}
                                    aria-label="Филтър по рейтинг"
                                >
                                    {RATING_FILTER_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end" style={{ paddingBottom: '0.375rem' }}>
                                <ToggleSwitch
                                    id="online-only-toggle"
                                    checked={isOnlineOnly}
                                    onChange={onOnlineOnlyChange}
                                    label="Само онлайн"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* active filter */}
            {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
                    {activeFilterChips.map((chip) => (
                        <span
                            key={chip.key}
                            className="inline-flex items-center bg-purple-50 text-purple-700 border border-purple-100"
                            style={{ gap: '0.375rem', padding: '0.3125rem 0.375rem 0.3125rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                        >
                            <span className="truncate" style={{ maxWidth: '10rem' }} title={chip.label}>
                                {chip.label}
                            </span>
                            <button
                                type="button"
                                onClick={chip.onRemove}
                                className="text-purple-600 hover:bg-purple-100 transition-colors flex items-center justify-center"
                                style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.25rem' }}
                                aria-label={`Премахни филтър: ${chip.label}`}
                            >
                                <span className="material-icons" style={{ fontSize: '0.875rem' }}>close</span>
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}
