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
    const { teachers, loading, refreshing, error, refresh } = useTeachers(user?.id ?? null);
    const [skeletonCount, setSkeletonCount] = useState(4);

    useEffect(() => {
        const mqXl = window.matchMedia("(min-width: 1280px)");
        const mqSm = window.matchMedia("(min-width: 640px)");
        const update = () => setSkeletonCount(mqXl.matches ? 8 : mqSm.matches ? 6 : 4);
        update();
        mqXl.addEventListener("change", update);
        mqSm.addEventListener("change", update);
        return () => {
            mqXl.removeEventListener("change", update);
            mqSm.removeEventListener("change", update);
        };
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
        <div className="flex min-h-full bg-slate-50 overflow-hidden relative">
            <div        
                className="pointer-events-none fixed top-0 right-0 -z-10 opacity-30"
                style={{ width: '30%', height: '100vh', background: 'linear-gradient(to left, rgba(126,34,206,0.04), transparent)' }}
            />

            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden" style={{ padding: 0 }}>
                {/* header */}
                <div className="border-b border-slate-200 bg-white">
                    <div style={{ padding: '2rem 2.5rem 1.5rem 2.5rem' }}>
                        <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '0.375rem' }}>
                            <div className="flex items-center justify-center bg-purple-50 text-purple-700" style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.375rem' }}>person_search</span>
                            </div>
                            <div>
                                <h1 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                    Намери учител
                                </h1>
                                <p className="text-slate-500" style={{ fontSize: '0.9375rem', marginTop: '0.125rem' }}>
                                    Открийте идеалния учител за вашата подготовка
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem 2.5rem 4rem 2.5rem' }}>

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
                    <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <h2 className="text-slate-400 uppercase" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                            Резултати
                        </h2>
                        <span className="flex-1 bg-slate-200" style={{ height: '1px' }} aria-hidden />
                    </div>

                    {error && teachers.length === 0 ? (
                        <div className="bg-white border border-red-200 text-center" style={{ borderRadius: '1rem', padding: '3rem 2rem' }}>
                            <div className="flex items-center justify-center bg-red-50 mx-auto" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                                <span className="material-icons text-red-600" style={{ fontSize: '1.5rem' }}>warning</span>
                            </div>
                            <h2 className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Неуспешно зареждане</h2>
                            <p className="text-slate-500" style={{ fontSize: '0.875rem', maxWidth: '20rem', margin: '0 auto 1.5rem' }}>
                                Списъкът с учители не можа да се зареди. Моля, опитайте отново.
                            </p>
                            <button
                                type="button"
                                onClick={refresh}
                                disabled={loading}
                                className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors disabled:opacity-50"
                                style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                            >
                                <span className="material-icons" style={{ fontSize: '1.125rem' }}>refresh</span>
                                Опитай отново
                            </button>
                        </div>
                    ) : loading && teachers.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '1.5rem' }}>
                            {Array.from({ length: skeletonCount }).map((_, i) => (
                                <TeacherCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : teachers.length === 0 ? (
                        <FindTeacherEmpty variant="no_teachers" />
                    ) : filteredTeachers.length === 0 ? (
                        <FindTeacherEmpty
                            variant="no_results"
                            onClearFilters={clearFilters}
                            filteredCount={filteredTeachers.length}
                            totalCount={teachers.length}
                        />
                    ) : (
                        <div className="relative">
                            {refreshing && (
                                <div
                                    className="absolute inset-0 z-10 flex items-start justify-center bg-white/60 backdrop-blur-[2px]"
                                    style={{ borderRadius: '1rem', paddingTop: '2rem' }}
                                    aria-hidden
                                >
                                    <span className="inline-flex items-center bg-slate-800/90 text-white" style={{ gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <div className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                                        Обновяване…
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '1.5rem' }}>
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
            </main>
        </div>
    );
};
