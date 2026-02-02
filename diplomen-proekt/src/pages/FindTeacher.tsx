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
    const { teachers, loading, refresh } = useTeachers(user?.id ?? null);
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
    } = useTeacherFilters(teachers);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero – лек pattern от точки + gradient */}
            <div className="find-teacher-hero relative overflow-hidden border-b border-slate-200/80">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.06),transparent)]" aria-hidden />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-2">
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
                    refreshing={loading}
                />

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8 lg:gap-y-10">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <TeacherCardSkeleton key={i} />
                        ))}
                    </div>
                ) : teachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_teachers" />
                ) : filteredTeachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_results" onClearFilters={clearFilters} />
                ) : (
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
                )}
            </div>
        </div>
    );
};
