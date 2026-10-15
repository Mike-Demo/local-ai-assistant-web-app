import { AlertTriangle, WifiOff, X } from 'lucide-react';
import type { ErrorCategory } from '../lib/errorHandling';
import { FRIENDLY_MESSAGES } from '../lib/errorHandling';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/** Non-blocking banner for runtime errors (chat generation failures, etc.). */
export function ErrorBanner({ category, onDismiss }: { category: ErrorCategory; onDismiss: () => void }) {
  return (
    <div className="animate-slide-up mx-auto mb-2 flex max-w-2xl items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
      <div role="alert" className="flex flex-1 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <p className="flex-1">{FRIENDLY_MESSAGES[category]}</p>
      </div>
      <button
        onClick={onDismiss}
        className="-m-1 inline-flex shrink-0 items-center gap-1 rounded-md p-1 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Dismiss
      </button>
    </div>
  );
}

/** Persistent pill when the device is offline. */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-neutral-900/90 px-3.5 py-1.5 text-xs text-white shadow-lg backdrop-blur"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      Offline — everything still works if the model is already downloaded.
    </div>
  );
}
