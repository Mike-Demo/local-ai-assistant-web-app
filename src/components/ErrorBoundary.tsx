import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { categorizeError, logError } from '../lib/errorHandling';

interface State {
  error: Error | null;
}

/** Last-resort boundary: a React crash shows a friendly recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(categorizeError(error), `${error.message} | ${info.componentStack?.slice(0, 120) ?? ''}`, null);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-[#F5F5F7] px-4 text-center dark:bg-neutral-950">
        <div className="glass-card max-w-md p-6">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            The app hit an unexpected error, but your data is safe — nothing left your device. Reloading usually fixes it.
          </p>
          <button onClick={() => window.location.reload()} className="btn-grad mt-5">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reload
          </button>
        </div>
      </div>
    );
  }
}
