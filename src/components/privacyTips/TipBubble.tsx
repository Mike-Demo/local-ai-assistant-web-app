import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Shuffle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePrivacyTips } from './privacyTipsContext';

/**
 * Speech bubble anchored under the Bit logo on larger screens; on phones it
 * floats above the bottom of the screen so it never covers the top bar.
 */
export function TipBubble() {
  const { currentTip, requested, closing, nextTip, dismissTip, openSettings } = usePrivacyTips();
  const wide = useMediaQuery('(min-width: 640px)');
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useFocusTrap(ref, Boolean(currentTip) && requested && !closing, dismissTip, 'container');

  // Tips that appear on their own don't take focus, but Escape still closes them.
  useEffect(() => {
    if (!currentTip || requested) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) dismissTip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTip, requested, dismissTip]);

  if (!currentTip) return null;

  const bubble = (
    <div
      ref={ref}
      role="dialog"
      aria-modal={requested ? 'true' : 'false'}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      tabIndex={-1}
      className={`${closing ? 'animate-tip-out' : 'animate-tip-in'} z-50 rounded-2xl border border-white/60 bg-white/95 p-4 text-left shadow-[0_12px_40px_rgb(47_111_181_/_0.22)] backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-neutral-900/95 ${
        wide ? 'absolute left-0 top-full mt-3 w-80 origin-top-left' : 'fixed inset-x-3 bottom-24 origin-bottom'
      }`}
    >
      {wide && (
        <span
          className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-white/60 bg-white/95 dark:border-white/10 dark:bg-neutral-900/95"
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <p id={titleId} className="inline-flex items-center gap-1.5 rounded-full bg-[#2f6fb5]/10 px-2.5 py-1 text-xs font-semibold text-[#245a96] dark:bg-sky-400/10 dark:text-sky-200">
          <span aria-hidden>{currentTip.emoji}</span>
          <span><span className="sr-only">Privacy tip: </span>{currentTip.categoryLabel}</span>
        </p>
        <button
          type="button"
          onClick={dismissTip}
          aria-label="Dismiss tip"
          className="-mr-1 -mt-1 rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p id={bodyId} className="mt-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
        {currentTip.message}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={dismissTip} className="btn-grad px-5 py-2">
          Got it!
        </button>
        <button
          type="button"
          onClick={nextTip}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/70 px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-white dark:border-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Shuffle className="h-3.5 w-3.5" aria-hidden /> Show me another tip
        </button>
        <button
          type="button"
          onClick={openSettings}
          aria-label="Tip settings"
          className="ml-auto rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  return wide ? bubble : createPortal(bubble, document.body);
}
