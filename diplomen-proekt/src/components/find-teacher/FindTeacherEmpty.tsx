type EmptyVariant = "no_teachers" | "no_results";

interface FindTeacherEmptyProps {
    variant: EmptyVariant;
    onClearFilters?: () => void;
}

const content = {
    no_teachers: {
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        ),
        title: "Няма учители в базата данни",
        description: "Все още няма регистрирани учители в системата.",
        hint: "Учителите трябва да създадат профил, за да се покажат тук.",
        showButton: false,
    },
    no_results: {
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        ),
        title: "Няма намерени учители",
        description: "Опитайте да промените филтрите си.",
        hint: null,
        showButton: true,
    },
};

export function FindTeacherEmpty({ variant, onClearFilters }: FindTeacherEmptyProps) {
    const config = content[variant];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 lg:p-16 text-center shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                >
                    {config.icon}
                </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{config.title}</h2>
            <p className="text-slate-600 mb-4 max-w-sm mx-auto">{config.description}</p>
            {config.hint && (
                <p className="text-sm text-slate-500 mb-6">{config.hint}</p>
            )}
            {config.showButton && onClearFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    Изчисти филтрите
                </button>
            )}
        </div>
    );
}
