interface RatingStarsProps {
    rating: number;
    max?: number;
    size?: "xs" | "sm" | "md";
}

const sizeClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
};

const filledClasses = {
    xs: "text-amber-300 fill-amber-300",
    sm: "text-amber-400 fill-amber-400",
    md: "text-yellow-400 fill-current",
};

const emptyClasses = {
    xs: "text-slate-200",
    sm: "text-slate-300",
    md: "text-gray-300",
};

export function RatingStars({ rating, max = 5, size = "sm" }: RatingStarsProps) {
    const rounded = Math.round(rating);
    const sizeCls = sizeClasses[size];
    const filled = filledClasses[size];
    const empty = emptyClasses[size];
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`Рейтинг: ${rating} от ${max}`}>
            {Array.from({ length: max }).map((_, i) => (
                <svg
                    key={i}
                    className={`${sizeCls} ${i < rounded ? filled : empty}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </span>
    );
}
