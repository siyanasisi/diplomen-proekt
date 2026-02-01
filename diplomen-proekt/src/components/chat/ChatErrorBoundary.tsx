import { Component, type ErrorInfo, type ReactNode } from "react";

interface ChatErrorBoundaryProps {
    children: ReactNode;
}

interface ChatErrorBoundaryState {
    hasError: boolean;
    retryKey: number;
}

export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
    state: ChatErrorBoundaryState = { hasError: false, retryKey: 0 };

    static getDerivedStateFromError(): Partial<ChatErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("[ChatErrorBoundary]", error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState((prev) => ({ hasError: false, retryKey: prev.retryKey + 1 }));
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-6 py-8 bg-slate-50/80">
                    <div className="flex flex-col items-center gap-3 text-center max-w-[280px]">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-[15px] font-semibold text-slate-800">Нещо се обърка</p>
                        <p className="text-[13px] text-slate-500 leading-relaxed">
                            Възникна проблем при показването на съобщенията. Опитайте отново.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleRetry}
                            className="mt-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[14px] font-medium hover:bg-[var(--accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
                        >
                            Опит отново
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div key={this.state.retryKey} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {this.props.children}
            </div>
        );
    }
}
