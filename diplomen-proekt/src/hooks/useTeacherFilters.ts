import { useState, useMemo, useCallback } from "react";
import type { Teacher, TeacherSortOption } from "../types/teacher";

export interface TeacherFiltersState {
    searchQuery: string;
    selectedSubject: string;
    selectedCity: string;
    selectedRating: number;
    isOnlineOnly: boolean;
    sortBy: TeacherSortOption;
}

const defaultFilters: TeacherFiltersState = {
    searchQuery: "",
    selectedSubject: "",
    selectedCity: "",
    selectedRating: 0,
    isOnlineOnly: false,
    sortBy: "rating",
};

function filterTeachers(teachers: Teacher[], filters: TeacherFiltersState): Teacher[] {
    let result = [...teachers];

    if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
            (t) =>
                t.full_name.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
        );
    }
    if (filters.selectedSubject) {
        result = result.filter((t) => t.subject === filters.selectedSubject);
    }
    if (filters.selectedCity) {
        if (filters.selectedCity === "Онлайн") {
            result = result.filter((t) => t.is_online);
        } else {
            result = result.filter((t) => t.city === filters.selectedCity);
        }
    }
    if (filters.isOnlineOnly) {
        result = result.filter((t) => t.is_online);
    }
    if (filters.selectedRating > 0) {
        result = result.filter((t) => t.rating >= filters.selectedRating);
    }

    return result;
}

function sortTeachers(list: Teacher[], sortBy: TeacherSortOption): Teacher[] {
    const copy = [...list];
    if (sortBy === "rating") {
        copy.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "name") {
        copy.sort((a, b) => a.full_name.localeCompare(b.full_name, "bg"));
    } else if (sortBy === "online_first") {
        copy.sort((a, b) => (a.is_online === b.is_online ? 0 : a.is_online ? -1 : 1));
    }
    return copy;
}

export function useTeacherFilters(teachers: Teacher[]) {
    const [filters, setFilters] = useState<TeacherFiltersState>(defaultFilters);

    const filteredTeachers = useMemo(
        () => filterTeachers(teachers, filters),
        [teachers, filters]
    );

    const sortedTeachers = useMemo(
        () => sortTeachers(filteredTeachers, filters.sortBy),
        [filteredTeachers, filters.sortBy]
    );

    const hasActiveFilters = Boolean(
        filters.searchQuery ||
        filters.selectedSubject ||
        filters.selectedCity ||
        filters.selectedRating > 0 ||
        filters.isOnlineOnly
    );

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    const setSearchQuery = useCallback((value: string) => {
        setFilters((prev) => ({ ...prev, searchQuery: value }));
    }, []);
    const setSelectedSubject = useCallback((value: string) => {
        setFilters((prev) => ({ ...prev, selectedSubject: value }));
    }, []);
    const setSelectedCity = useCallback((value: string) => {
        setFilters((prev) => ({ ...prev, selectedCity: value }));
    }, []);
    const setSelectedRating = useCallback((value: number) => {
        setFilters((prev) => ({ ...prev, selectedRating: value }));
    }, []);
    const setIsOnlineOnly = useCallback((value: boolean) => {
        setFilters((prev) => ({ ...prev, isOnlineOnly: value }));
    }, []);
    const setSortBy = useCallback((value: TeacherSortOption) => {
        setFilters((prev) => ({ ...prev, sortBy: value }));
    }, []);

    return {
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
    };
}
