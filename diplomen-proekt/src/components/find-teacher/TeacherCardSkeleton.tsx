export function TeacherCardSkeleton() {
    return (
        <article className="flex h-full flex-col bg-white overflow-hidden" style={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex flex-wrap items-center" style={{ padding: '1.25rem 1.25rem 0', gap: '0.375rem' }}>
                <span className="bg-slate-200 animate-pulse" style={{ height: '1.625rem', width: '4.5rem', borderRadius: '0.5rem' }} />
                <span className="bg-slate-100 animate-pulse" style={{ height: '1.625rem', width: '3.5rem', borderRadius: '0.5rem' }} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col" style={{ padding: '1rem 1.25rem 1.25rem' }}>
                <div className="flex items-start" style={{ gap: '1rem', marginBottom: '0.875rem' }}>
                    <div className="bg-slate-200 animate-pulse shrink-0" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '0.75rem' }} />
                    <div className="flex-1 min-w-0" style={{ paddingTop: '0.125rem' }}>
                        <div className="bg-slate-200 animate-pulse" style={{ height: '1.125rem', width: '66%', borderRadius: '0.25rem' }} />
                        <div className="bg-slate-100 animate-pulse" style={{ height: '0.75rem', width: '50%', borderRadius: '0.25rem', marginTop: '0.625rem' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <div className="bg-slate-100 animate-pulse" style={{ height: '0.75rem', width: '100%', borderRadius: '0.25rem' }} />
                    <div className="bg-slate-100 animate-pulse" style={{ height: '0.75rem', width: '90%', borderRadius: '0.25rem', marginTop: '0.5rem' }} />
                </div>
                <div className="mt-auto flex flex-wrap items-center" style={{ paddingTop: '0.75rem', gap: '0.5rem' }}>
                    <div className="bg-slate-200 animate-pulse" style={{ height: '2.125rem', width: '6rem', borderRadius: '0.5rem' }} />
                    <div className="bg-slate-100 animate-pulse" style={{ height: '2.125rem', width: '5rem', borderRadius: '0.5rem' }} />
                </div>
            </div>
        </article>
    );
}
