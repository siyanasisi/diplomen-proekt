import { useState, useEffect } from "react";


 // returns debounced value - changes after delay ms without changing value
 
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debouncedValue;
}
