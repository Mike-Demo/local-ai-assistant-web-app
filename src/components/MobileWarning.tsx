import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { dismissMobileWarning, isMobileWarningDismissed } from '@/lib/beta';

export function MobileWarning() {
  const [hidden, setHidden] = useState(isMobileWarningDismissed);
  if (hidden) return null;

  const dismiss = () => {
    dismissMobileWarning();
    setHidden(true);
  };

  return (
    <div
      role="note"
      aria-label="Mobile device notice"
      className="animate-fade-in relative flex w-full max-w-md items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 py-3 pl-4 pr-10 text-left text-sm leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">You're on a phone or tablet</p>
        <p className="mt-1">
          On-device AI works best on a desktop or laptop. On mobile it may run slowly, warm up your device and drain the
          battery. The download is large, so use Wi-Fi. Smaller models are the best fit here.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss mobile notice"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-100 dark:hover:bg-amber-900/50"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
