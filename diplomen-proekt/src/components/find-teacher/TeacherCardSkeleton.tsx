export function TeacherCardSkeleton() {
    return (
        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6 flex flex-wrap items-center gap-2">
                <span className="h-6 w-20 rounded-md bg-slate-200 animate-pulse" />
                <span className="h-6 w-16 rounded-md bg-slate-100 animate-pulse" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-5 pt-4 sm:p-6 sm:pt-5">
                <div className="flex items-start gap-4 sm:gap-5 mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-5 w-2/3 rounded bg-slate-200 animate-pulse" />
                        <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-2 mb-4">
                    <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-full max-w-[90%] rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                    <div className="h-9 w-24 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="h-9 w-20 rounded-lg bg-slate-100 animate-pulse" />
                </div>
            </div>
        </article>
    );
}
