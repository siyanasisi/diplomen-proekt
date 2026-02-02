import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTeachers } from "../hooks/useTeachers";
import { useTeacherFilters } from "../hooks/useTeacherFilters";
import {
    TeacherCard,
    TeacherCardSkeleton,
    TeacherFilters,
    TeacherResultsBar,
    FindTeacherEmpty,
} from "../components/find-teacher";

export const FindTeacher = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { teachers, loading, refreshing, refresh } = useTeachers(user?.id ?? null);
    const [skeletonCount, setSkeletonCount] = useState(4);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 640px)");
        const update = () => setSkeletonCount(mq.matches ? 6 : 4);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    const urlOptions = useMemo(
        () => ({
            searchParams,
            setSearchParams: (next: Record<string, string | undefined>, opts?: { replace?: boolean }) => {
                const clean: Record<string, string> = {};
                Object.entries(next).forEach(([k, v]) => {
                    if (v !== undefined && v !== "") clean[k] = v;
                });
                setSearchParams(clean, opts);
            },
        }),
        [searchParams, setSearchParams]
    );

    const {
        filters,
        setSearchQuery,
        setSelectedSubject,
        setSelectedCity,
        setSelectedRating,
        setIsOnlineOnly,
        setSortBy,
        filteredTeachers,
        sortedTeachers,
        hasActiveFilters,
        activeFiltersCount,
        activeFilterChips,
        clearFilters,
    } = useTeacherFilters(teachers, urlOptions);

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* hero */}
            <div className="find-teacher-hero relative overflow-hidden border-b border-slate-200/80">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.06),transparent)]" aria-hidden />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                        <span className="flex-shrink-0 text-slate-400/70" aria-hidden>
                            <svg className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        Намери учител
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 max-w-xl">
                        Открийте идеалния учител за вашата подготовка
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

                <TeacherFilters
                    searchQuery={filters.searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedSubject={filters.selectedSubject}
                    onSubjectChange={setSelectedSubject}
                    selectedCity={filters.selectedCity}
                    onCityChange={setSelectedCity}
                    selectedRating={filters.selectedRating}
                    onRatingChange={setSelectedRating}
                    isOnlineOnly={filters.isOnlineOnly}
                    onOnlineOnlyChange={setIsOnlineOnly}
                    hasActiveFilters={hasActiveFilters}
                    activeFiltersCount={activeFiltersCount}
                    activeFilterChips={activeFilterChips}
                    onClearFilters={clearFilters}
                />

                <TeacherResultsBar
                    filteredCount={filteredTeachers.length}
                    totalCount={teachers.length}
                    sortBy={filters.sortBy}
                    onSortChange={setSortBy}
                    onRefresh={refresh}
                    refreshing={refreshing || loading}
                />

                {/* separator */}
                <div className="mb-4 flex items-center gap-3">
                    <h2 id="teacher-results" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                        Резултати
                    </h2>
                    <span className="flex-1 h-px bg-slate-200" aria-hidden />
                </div>

                {loading && teachers.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8 lg:gap-y-10">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                            <TeacherCardSkeleton key={i} />
                        ))}
                    </div>
                ) : teachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_teachers" />
                ) : filteredTeachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_results" onClearFilters={clearFilters} />
                ) : (
                    <div className="relative">
                        {/* overlay */}
                        {refreshing && (
                            <div
                                className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/60 backdrop-blur-[2px] pt-8"
                                aria-hidden
                            >
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Обновяване…
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8 lg:gap-y-10">
                            {sortedTeachers.map((teacher, index) => (
                                <div
                                    key={teacher.id}
                                    className="find-teacher-card-enter h-full"
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    <TeacherCard
                                        teacher={teacher}
                                        isLoggedIn={Boolean(user)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
