import { useAuth } from "../context/AuthContext";
import { useTeachers } from "../hooks/useTeachers";
import { useTeacherFilters } from "../hooks/useTeacherFilters";
import {
    TeacherCard,
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
        clearFilters,
    } = useTeacherFilters(teachers);

    if (loading && teachers.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" aria-hidden />
                    <p className="text-base font-medium text-slate-600">Зареждане...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.08),transparent)]" aria-hidden />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-sm">
                        <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" aria-hidden />
                        <p className="text-sm font-medium text-slate-600">Зареждане на учители...</p>
                    </div>
                ) : teachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_teachers" />
                ) : filteredTeachers.length === 0 ? (
                    <FindTeacherEmpty variant="no_results" onClearFilters={clearFilters} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:gap-x-8 lg:gap-y-10">
                        {sortedTeachers.map((teacher) => (
                            <TeacherCard
                                key={teacher.id}
                                teacher={teacher}
                                isLoggedIn={Boolean(user)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
