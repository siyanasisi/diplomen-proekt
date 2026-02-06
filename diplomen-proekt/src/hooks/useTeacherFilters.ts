import { useState, useMemo, useCallback, useEffect } from "react";
import type { Teacher, TeacherSortOption } from "../types/teacher";
import { RATING_FILTER_OPTIONS, TEACHER_SUBJECTS, TEACHER_CITIES } from "../constants/teachers";
import { useDebounce } from "./useDebounce";

const SEARCH_DEBOUNCE_MS = 280;

const VALID_SORT: TeacherSortOption[] = ["rating", "name", "online_first"];
const VALID_RATINGS = [0, 4, 4.5, 5];

export interface UseTeacherFiltersUrlOptions {
    searchParams: URLSearchParams;
    setSearchParams: (next: Record<string, string | undefined>, opts?: { replace?: boolean }) => void;
}

function parseFiltersFromSearchParams(searchParams: URLSearchParams): TeacherFiltersState {
    const q = searchParams.get("q") ?? "";
    const subject = searchParams.get("subject") ?? "";
    const city = searchParams.get("city") ?? "";
    const ratingRaw = searchParams.get("rating");
    const rating = ratingRaw !== null && VALID_RATINGS.includes(Number(ratingRaw))
        ? Number(ratingRaw)
        : 0;
    const isOnlineOnly = searchParams.get("online") === "1";
    const sort = searchParams.get("sort") ?? "rating";
    const sortBy: TeacherSortOption = VALID_SORT.includes(sort as TeacherSortOption)
        ? (sort as TeacherSortOption)
        : "rating";
    const subjectValid = subject && TEACHER_SUBJECTS.includes(subject as typeof TEACHER_SUBJECTS[number]);
    const cityValid = city && (city === "Онлайн" || TEACHER_CITIES.includes(city as typeof TEACHER_CITIES[number]));
    return {
        searchQuery: q,
        selectedSubject: subjectValid ? subject : "",
        selectedCity: cityValid ? city : "",
        selectedRating: rating,
        isOnlineOnly,
        sortBy,
    };
}

function filtersToSearchParams(filters: TeacherFiltersState): Record<string, string | undefined> {
    const p: Record<string, string | undefined> = {};
    if (filters.searchQuery) p.q = filters.searchQuery;
    if (filters.selectedSubject) p.subject = filters.selectedSubject;
    if (filters.selectedCity) p.city = filters.selectedCity;
    if (filters.selectedRating > 0) p.rating = String(filters.selectedRating);
    if (filters.isOnlineOnly) p.online = "1";
    if (filters.sortBy !== "rating") p.sort = filters.sortBy;
    return p;
}

export interface ActiveFilterChip {
    key: string;
    label: string;
    onRemove: () => void;
}

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
                (t.description ?? "").toLowerCase().includes(q)
        );
    }
    if (filters.selectedSubject) {
        result = result.filter((t) => t.subject === filters.selectedSubject);
    }
    if (filters.selectedCity) {
        if (filters.selectedCity === "Онлайн") {
            result = result.filter((t) => t.offers_online_lessons === true);
        } else {
            result = result.filter((t) => t.city === filters.selectedCity);
        }
    }
    if (filters.isOnlineOnly) {
        result = result.filter((t) => t.offers_online_lessons === true);
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
        copy.sort((a, b) => (a.offers_online_lessons === b.offers_online_lessons ? 0 : a.offers_online_lessons ? -1 : 1));
    }
    return copy;
}

export function useTeacherFilters(teachers: Teacher[], urlOptions?: UseTeacherFiltersUrlOptions) {
    const [filters, setFilters] = useState<TeacherFiltersState>(() =>
        urlOptions ? parseFiltersFromSearchParams(urlOptions.searchParams) : defaultFilters
    );

    const searchParams = urlOptions?.searchParams ?? null;
    const setSearchParams = urlOptions?.setSearchParams ?? null;

    useEffect(() => {
        if (searchParams) {
            setFilters(parseFiltersFromSearchParams(searchParams));
        }
    }, [searchParams?.toString()]);

    const syncFiltersToUrl = useCallback(
        (next: TeacherFiltersState) => {
            setSearchParams?.(filtersToSearchParams(next), { replace: true });
        },
        [setSearchParams]
    );

    const debouncedSearchQuery = useDebounce(filters.searchQuery, SEARCH_DEBOUNCE_MS);
    // when the field is cleared we immediately use "" without waiting for debounce
    const effectiveSearchQuery =
        filters.searchQuery === "" ? "" : debouncedSearchQuery;

    const filtersForFiltering = useMemo(
        () => ({ ...filters, searchQuery: effectiveSearchQuery }),
        [filters, effectiveSearchQuery]
    );

    const filteredTeachers = useMemo(
        () => filterTeachers(teachers, filtersForFiltering),
        [teachers, filtersForFiltering]
    );

    const sortedTeachers = useMemo(
        () => sortTeachers(filteredTeachers, filters.sortBy),
        [filteredTeachers, filters.sortBy]
    );

    const hasActiveFilters = Boolean(
        effectiveSearchQuery ||
        filters.selectedSubject ||
        filters.selectedCity ||
        filters.selectedRating > 0 ||
        filters.isOnlineOnly
    );

    const activeFiltersCount = useMemo(() => {
        let n = 0;
        if (effectiveSearchQuery) n++;
        if (filters.selectedSubject) n++;
        if (filters.selectedCity) n++;
        if (filters.selectedRating > 0) n++;
        if (filters.isOnlineOnly) n++;
        return n;
    }, [effectiveSearchQuery, filters.selectedSubject, filters.selectedCity, filters.selectedRating, filters.isOnlineOnly]);

    const activeFilterChips = useMemo((): ActiveFilterChip[] => {
        const chips: ActiveFilterChip[] = [];
        if (effectiveSearchQuery) {
            chips.push({
                key: "search",
                label: effectiveSearchQuery,
                onRemove: () => setFilters((prev) => ({ ...prev, searchQuery: "" })),
            });
        }
        if (filters.selectedSubject) {
            chips.push({
                key: "subject",
                label: filters.selectedSubject,
                onRemove: () => setFilters((prev) => ({ ...prev, selectedSubject: "" })),
            });
        }
        if (filters.selectedCity) {
            chips.push({
                key: "city",
                label: filters.selectedCity,
                onRemove: () => setFilters((prev) => ({ ...prev, selectedCity: "" })),
            });
        }
        if (filters.selectedRating > 0) {
            const opt = RATING_FILTER_OPTIONS.find((o) => o.value === filters.selectedRating);
            chips.push({
                key: "rating",
                label: opt?.label ?? `${filters.selectedRating}+ звезди`,
                onRemove: () => setFilters((prev) => ({ ...prev, selectedRating: 0 })),
            });
        }
        if (filters.isOnlineOnly) {
            chips.push({
                key: "online",
                label: "Само онлайн",
                onRemove: () => setFilters((prev) => ({ ...prev, isOnlineOnly: false })),
            });
        }
        return chips;
    }, [
        effectiveSearchQuery,
        filters.selectedSubject,
        filters.selectedCity,
        filters.selectedRating,
        filters.isOnlineOnly,
    ]);

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
        if (setSearchParams) {
            setSearchParams({}, { replace: true });
        }
    }, [setSearchParams]);

    useEffect(() => {
        if (setSearchParams == null) return;
        syncFiltersToUrl({ ...filters, searchQuery: effectiveSearchQuery });
    }, [
        filters.selectedSubject,
        filters.selectedCity,
        filters.selectedRating,
        filters.isOnlineOnly,
        filters.sortBy,
        effectiveSearchQuery,
        setSearchParams,
    ]);

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
        activeFiltersCount,
        activeFilterChips,
        clearFilters,
    };
}
