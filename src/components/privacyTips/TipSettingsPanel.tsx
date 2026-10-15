import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';
import { TIP_CATEGORIES, TIP_FREQUENCIES, type TipCategoryId } from '@/data/privacyTips';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { usePrivacyTips } from './privacyTipsContext';

export function TipSettingsPanel() {
  const { prefs, updatePrefs, closeSettings, showTip } = usePrivacyTips();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, closeSettings);

  const toggleCategory = (id: TipCategoryId, on: boolean) => {
    const set = new Set(prefs.categories);
    if (on) set.add(id);
    else set.delete(id);
    updatePrefs({ categories: TIP_CATEGORIES.map((c) => c.id).filter((c) => set.has(c)) });
  };

  const off = !prefs.enabled;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSettings} aria-hidden />
      <div
        ref={ref}
        className="animate-slide-up scrollbar-thin relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/40 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95 sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold">
            <Settings className="h-5 w-5 text-[#2f6fb5] dark:text-sky-300" aria-hidden /> Privacy tips from Bit
          </h2>
          <button
            type="button"
            onClick={closeSettings}
            aria-label="Close tip settings"
            className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl bg-neutral-100/80 p-4 dark:bg-neutral-800/70">
          <div>
            <p id={`${titleId}-switch`} className="text-sm font-semibold">Pop-up tips</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {off ? "Bit won't pop up on its own. You can still tap Bit any time for a tip." : 'Bit shares a tip now and then, only at quiet moments.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.enabled}
            aria-labelledby={`${titleId}-switch`}
            onClick={() => updatePrefs({ enabled: !prefs.enabled })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${prefs.enabled ? 'bg-[#2f6fb5]' : 'bg-neutral-400 dark:bg-neutral-600'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.enabled ? 'translate-x-6' : 'translate-x-1'}`} aria-hidden />
          </button>
        </div>

        <fieldset className="mt-5" disabled={off}>
          <legend className="text-sm font-semibold">How often</legend>
          <div className={`mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 ${off ? 'opacity-50' : ''}`}>
            {TIP_FREQUENCIES.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white/70 px-3 py-2 text-xs font-medium transition has-[:checked]:border-[#2f6fb5] has-[:checked]:bg-[#2f6fb5]/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f6fb5] dark:border-neutral-700 dark:bg-white/5 dark:has-[:checked]:bg-sky-400/10"
              >
                <input
                  type="radio"
                  name="tip-frequency"
                  value={f.id}
                  checked={prefs.frequency === f.id}
                  onChange={() => updatePrefs({ frequency: f.id })}
                  className="h-3.5 w-3.5 accent-[#2f6fb5]"
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Topics</legend>
          <div className="mt-2 space-y-1.5">
            {TIP_CATEGORIES.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-neutral-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f6fb5] dark:hover:bg-neutral-800"
              >
                <input
                  type="checkbox"
                  checked={prefs.categories.includes(c.id)}
                  onChange={(e) => toggleCategory(c.id, e.target.checked)}
                  className="h-4 w-4 rounded accent-[#2f6fb5]"
                />
                <span aria-hidden>{c.emoji}</span>
                {c.label}
              </label>
            ))}
          </div>
          {prefs.categories.length === 0 && (
            <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Pick at least one topic so Bit has something to share.
            </p>
          )}
        </fieldset>

        <p className="mt-5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">These settings are saved in this browser only.</p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={prefs.categories.length === 0}
            onClick={() => {
              closeSettings();
              showTip();
            }}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Show a tip now
          </button>
          <button type="button" onClick={closeSettings} className="btn-grad">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
