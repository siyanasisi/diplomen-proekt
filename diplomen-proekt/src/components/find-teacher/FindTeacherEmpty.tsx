import { Link } from "react-router-dom";

type EmptyVariant = "no_teachers" | "no_results";

interface FindTeacherEmptyProps {
    variant: EmptyVariant;
    onClearFilters?: () => void;
}

const content = {
    no_teachers: {
        icon: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </>
        ),
        title: "Няма учители в базата данни",
        description: "Все още няма регистрирани учители в системата.",
        hint: "Учителите трябва да създадат профил, за да се покажат тук.",
        showButton: false,
    },
    no_results: {
        icon: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </>
        ),
        title: "Няма намерени учители",
        description: "Опитайте да промените филтрите си или изчистете филтрите за пълен списък.",
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
            {variant === "no_teachers" && (
                <Link
                    to="/signup"
                    className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    Регистрирайте се като учител
                </Link>
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
