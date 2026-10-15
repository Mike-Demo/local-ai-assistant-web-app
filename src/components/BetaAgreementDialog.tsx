import { useId, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, FlaskConical, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { BETA_TERMS_PATH } from '@/lib/beta';

const SUMMARY = [
  'The app is still in testing and may have bugs or change without notice.',
  'AI answers can be wrong. They are not medical, legal or financial advice.',
  'It is provided "as is", with no guarantees.',
  'Models are large downloads that use your data and storage.',
  'Your chats never leave this device. We collect nothing.',
];

export function BetaAgreementDialog({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const checkId = useId();
  useFocusTrap(ref, true, onCancel);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="animate-fade-in absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        ref={ref}
        className="animate-slide-up relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/50 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <FlaskConical className="h-5 w-5" aria-hidden />
        </span>
        <h2 id={titleId} className="mt-4 text-xl font-bold leading-tight tracking-tight">Before you start: this is a beta</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">The short version of our beta terms:</p>

        <ul className="mt-4 space-y-2.5">
          {SUMMARY.map((line) => (
            <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600 dark:bg-sky-400" aria-hidden />
              {line}
            </li>
          ))}
        </ul>

        <a
          href={BETA_TERMS_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#245a96] hover:underline dark:text-sky-200"
        >
          Read the full beta terms
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>

        <label
          htmlFor={checkId}
          className={`mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-sm leading-relaxed transition ${
            checked
              ? 'border-sky-600/50 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-950/40'
              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
          }`}
        >
          <input
            id={checkId}
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-sky-700"
          />
          <span className="text-neutral-800 dark:text-neutral-200">I understand this is beta software and agree to the beta terms.</span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!checked}
            className="btn-grad text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            Agree and continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
