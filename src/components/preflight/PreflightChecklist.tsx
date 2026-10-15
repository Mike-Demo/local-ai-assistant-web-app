import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Circle, Copy, Check, Loader2, MinusCircle, XCircle } from 'lucide-react';
import type { CheckResult, CheckStatus, PreflightLogEntry } from '@/lib/preflight';
import { speedLabel } from '@/lib/speedLabel';

const STATUS_META: Record<CheckStatus, { label: string; tone: string }> = {
  pending: { label: 'Waiting', tone: 'text-neutral-500 dark:text-neutral-400' },
  running: { label: 'Running', tone: 'text-[#2f6fb5] dark:text-sky-300' },
  passed: { label: 'Passed', tone: 'text-emerald-700 dark:text-emerald-400' },
  warning: { label: 'Warning', tone: 'text-amber-700 dark:text-amber-400' },
  failed: { label: 'Failed', tone: 'text-red-700 dark:text-red-400' },
  skipped: { label: 'Not tested', tone: 'text-neutral-600 dark:text-neutral-400' },
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const cls = `h-5 w-5 shrink-0 ${STATUS_META[status].tone}`;
  switch (status) {
    case 'running':
      return <Loader2 className={`${cls} animate-spin`} aria-hidden />;
    case 'passed':
      return <CheckCircle2 className={cls} aria-hidden />;
    case 'warning':
      return <AlertTriangle className={cls} aria-hidden />;
    case 'failed':
      return <XCircle className={cls} aria-hidden />;
    case 'skipped':
      return <MinusCircle className={cls} aria-hidden />;
    default:
      return <Circle className={cls} aria-hidden />;
  }
}

function CheckRow({ check, highlight }: { check: CheckResult; highlight: boolean }) {
  const meta = STATUS_META[check.status];
  const running = check.status === 'running';
  return (
    <li
      className={`rounded-xl border p-3 transition-colors duration-300 sm:p-4 ${
        running
          ? 'border-[#4A90D9]/50 bg-[#4A90D9]/[0.06] dark:bg-[#4A90D9]/10'
          : highlight
            ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
            : 'border-neutral-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={check.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {check.label}
              {highlight && (
                <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Best fit</span>
              )}
            </p>
            <span className={`text-xs font-medium ${meta.tone}`}>
              {meta.label}
              {check.status === 'passed' && speedLabel(check.tokensPerSecond) ? ` · ${speedLabel(check.tokensPerSecond)}` : ''}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{check.detail}</p>
          {check.reason && check.status !== 'passed' && (
            <p className={`mt-1 text-xs leading-relaxed ${check.status === 'failed' ? 'text-red-700 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {check.reason}
            </p>
          )}
          {running && check.stage && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#6a4f94] via-[#2f6fb5] to-[#0a7f9a] transition-[width] duration-300 ${check.stage === 'inference' ? 'w-full animate-pulse' : ''}`}
                  style={check.stage === 'download' ? { width: `${Math.max(check.progress ?? 0, 3)}%` } : undefined}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {check.stage === 'download'
                  ? `${check.cached ? 'Loading from this device' : 'Downloading and loading'} · ${check.progress ?? 0}%`
                  : 'Asking it to say hi…'}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function PreflightChecklist({
  title,
  checks,
  bestModelId,
}: {
  title: string;
  checks: CheckResult[];
  bestModelId: string | null;
}) {
  if (!checks.length) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">{title}</h2>
      <ul className="space-y-2">
        {checks.map((c) => (
          <CheckRow key={c.key} check={c} highlight={c.model !== null && c.model.id === bestModelId} />
        ))}
      </ul>
    </section>
  );
}

export function DebugLog({ entries }: { entries: PreflightLogEntry[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="preflight-debug-log"
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-300 dark:hover:bg-white/5"
      >
        <span>Debug log ({entries.length})</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div id="preflight-debug-log" className="border-t border-neutral-200/80 px-4 pb-4 pt-3 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">Stays on this device. Copy it only if you want to report a problem.</p>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <ol className="scrollbar-thin max-h-64 space-y-1 overflow-y-auto rounded-lg bg-neutral-100/80 p-2 font-mono text-xs leading-relaxed text-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200">
            {entries.map((e) => (
              <li key={e.id} className="break-words">
                <span className="text-neutral-500 dark:text-neutral-400">{e.timestamp.slice(11, 19)}</span>{' '}
                <span className={e.level === 'error' ? 'text-red-700 dark:text-red-400' : e.level === 'warn' ? 'text-amber-700 dark:text-amber-400' : ''}>
                  {e.event}
                </span>
                {e.error && <span className="block pl-4 text-red-700 dark:text-red-400">{e.error.length > 300 ? `${e.error.slice(0, 300)}…` : e.error}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
