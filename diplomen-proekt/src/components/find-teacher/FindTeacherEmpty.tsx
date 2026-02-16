import { Link } from "react-router-dom";

type EmptyVariant = "no_teachers" | "no_results";

export interface FindTeacherEmptyProps {
    variant: EmptyVariant;
    onClearFilters?: () => void;
    filteredCount?: number;
    totalCount?: number;
}

const content = {
    no_teachers: {
        icon: "school",
        title: "Няма учители в базата данни",
        description: "Все още няма регистрирани учители в системата.",
        hint: "Учителите трябва да създадат профил, за да се покажат тук.",
    },
    no_results: {
        icon: "person_search",
        title: "Няма намерени учители",
        description: "Опитайте да промените филтрите си или изчистете филтрите за пълен списък.",
        hint: null,
    },
};

export function FindTeacherEmpty({ variant, onClearFilters, filteredCount = 0, totalCount }: FindTeacherEmptyProps) {
    const config = content[variant];
    const showCounts = variant === "no_results" && totalCount != null && totalCount > 0;

    return (
        <div className="bg-white border border-slate-200 text-center" style={{ borderRadius: '1rem', padding: '3rem 2rem' }}>
            <div className="flex items-center justify-center bg-purple-50 text-purple-700 mx-auto" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                <span className="material-icons" style={{ fontSize: '1.5rem' }}>{config.icon}</span>
            </div>
            <h2 className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{config.title}</h2>
            <p className="text-slate-500 mx-auto" style={{ fontSize: '0.875rem', maxWidth: '22rem', marginBottom: '0.75rem' }}>{config.description}</p>
            {showCounts && (
                <p className="text-slate-400" style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                    Няма учители при тези филтри ({filteredCount} от {totalCount})
                </p>
            )}
            {config.hint && (
                <p className="text-slate-400" style={{ fontSize: '0.8125rem', marginBottom: '1.25rem' }}>{config.hint}</p>
            )}
            {variant === "no_teachers" && (
                <Link
                    to="/signup"
                    className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors"
                    style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                >
                    Регистрирайте се като учител
                </Link>
            )}
            {variant === "no_results" && onClearFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="bg-purple-700 hover:bg-purple-800 text-white inline-flex items-center transition-colors"
                    style={{ gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                >
                    <span className="material-icons" style={{ fontSize: '1rem' }}>filter_list_off</span>
                    Изчисти филтрите
                </button>
            )}
        </div>
    );
}
