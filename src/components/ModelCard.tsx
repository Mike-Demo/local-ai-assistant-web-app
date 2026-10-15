import { ExternalLink, FlaskConical, Pi, ToggleLeft } from 'lucide-react';
import type { CatalogModel, HardwareClass } from '../lib/catalogTypes';

function badge(fit: boolean): string {
  return fit ? 'Great match for your device' : 'May need more memory';
}

export function ModelCard({
  model,
  yourHardware,
  onOpenDetail,
}: {
  model: CatalogModel;
  yourHardware: HardwareClass | null;
  onOpenDetail: (model: CatalogModel) => void;
}) {
  const hardwareFitOk = yourHardware ? model.hardwareFit.badgeRole.hardware.includes(yourHardware) : null;
  return (
    <article
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500 dark:border-neutral-800 dark:bg-neutral-900"
      aria-labelledby={`${model.slug}-name`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id={`${model.slug}-name`} className="text-sm font-semibold leading-snug">
            {model.name}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{model.provider}</p>
        </div>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium dark:bg-neutral-800" aria-label="license">
          {model.license}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{model.oneLiner}</p>
      <div className="mt-2 flex flex-wrap gap-1" aria-label="hardware compatibility badges">
        {model.hardwareFit.badgeRole.hardware.map((h) => (
          <span
            key={h}
            className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            {h.replace('-', ' ')}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
        <Pi className="mr-1 inline h-3 w-3" aria-hidden />
        <span>{model.paramsB}B · </span>
        <span>{model.quants.map((q) => q.quant).join('/')} · </span>
        <FlaskConical className="mr-1 inline h-3 w-3" aria-hidden />
        <span>~{model.recommendedVramGb} GB recommended</span>
      </div>
      {hardwareFitOk != null && (
        <div
          className={`mt-2 rounded-lg px-2 py-1 text-xs font-medium ${
            hardwareFitOk ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
          }`}
          aria-live="polite"
        >
          {badge(hardwareFitOk)}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {model.webllm.supported ? (
          <button
            onClick={() => onOpenDetail(model)}
            className="flex-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
          >
            Try in Browser
          </button>
        ) : (
          <a
            href={model.hfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            <span>View details</span>
            <span className="sr-only">(opens Hugging Face in a new tab)</span>
          </a>
        )}
        <button
          onClick={() => onOpenDetail(model)}
          aria-label={`More about ${model.name}`}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <ToggleLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function ModelCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800" />
      <div className="mt-3 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
      <div className="mt-3 h-3 w-5/6 rounded bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}
