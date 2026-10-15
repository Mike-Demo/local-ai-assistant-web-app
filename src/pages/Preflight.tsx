import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Cpu, Download, Gauge, Loader2, RefreshCw, Square, XCircle } from 'lucide-react';
import { usePreflightCheck } from '@/hooks/usePreflightCheck';
import { usePauseTips } from '@/components/privacyTips/privacyTipsContext';
import { DebugLog, PreflightChecklist } from '@/components/preflight/PreflightChecklist';
import type { PreflightOutcome } from '@/lib/preflight';
import { speedLabel } from '@/lib/speedLabel';

const outlineBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:bg-neutral-800';

export default function Preflight({
  onProceed,
  onExit,
}: {
  onProceed: (outcome: PreflightOutcome, alreadyLoaded: boolean) => void;
  onExit: () => void;
}) {
  const pf = usePreflightCheck();
  usePauseTips(pf.phase !== 'done');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { prepare } = pf;

  useEffect(() => {
    void prepare();
  }, [prepare]);

  useEffect(() => {
    if (pf.phase === 'confirm' || pf.phase === 'done') headingRef.current?.focus();
  }, [pf.phase]);

  const deviceChecks = pf.checks.filter((c) => c.kind !== 'model');
  const modelChecks = pf.checks.filter((c) => c.kind === 'model');
  const failed = modelChecks.filter((c) => c.status === 'failed');
  const passed = modelChecks.filter((c) => c.status === 'passed');
  const bestId = pf.best?.modelId ?? null;

  const exit = () => {
    void pf.discard().then(onExit);
  };
  const proceed = async () => {
    if (!pf.best) return;
    const loaded = await pf.proceed();
    onProceed(pf.best, loaded);
  };

  const heading =
    pf.phase === 'done'
      ? pf.best
        ? 'Your device is ready'
        : 'No model passed on this device'
      : pf.phase === 'running'
        ? 'Testing models on your device…'
        : pf.phase === 'confirm'
          ? 'Ready to test models'
          : 'Checking your device…';

  return (
    <div className="relative min-h-full px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 animate-float rounded-full bg-[#4A90D9]/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-24 h-72 w-72 animate-float-delayed rounded-full bg-[#7B5EA7]/15 blur-3xl" aria-hidden />
      <p className="sr-only" aria-live="polite" aria-atomic="true">{pf.announcement}</p>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={exit}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>

        <header className="mt-4 flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundImage: 'linear-gradient(120deg, #6a4f94, #2f6fb5 60%, #0a7f9a)' }}>
            <Gauge className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight focus:outline-none sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              We try models from smallest to largest and pick the biggest one your device runs reliably. Everything happens on this device.
            </p>
          </div>
        </header>

        {pf.phase === 'scanning' && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Looking at your graphics, memory and storage…
          </p>
        )}

        {pf.phase === 'confirm' && (
          <div className="animate-slide-up mt-6 rounded-2xl border border-[#4A90D9]/30 bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-neutral-900/70">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-[#2f6fb5] dark:text-sky-300" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {pf.downloadGb > 0 ? `Up to ${pf.downloadGb} GB will be downloaded` : 'Nothing new to download'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {pf.testableCount} model{pf.testableCount === 1 ? '' : 's'} will be tested. Downloads happen once and are reused later; models already on this device load instantly. You can stop at any time and keep the best result so far.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => void pf.run()} className="btn-grad">
                <Cpu className="h-4 w-4" aria-hidden /> Start the test
              </button>
              <button type="button" onClick={exit} className={outlineBtn}>Not now</button>
            </div>
          </div>
        )}

        {pf.phase === 'running' && (
          <div className="animate-fade-in mt-6 rounded-2xl border border-neutral-200/80 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-neutral-900/70">
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>Overall progress</span>
              <span>{pf.overallPercent}%</span>
            </div>
            <div className="progress-track mt-2" role="progressbar" aria-label="Overall test progress" aria-valuenow={pf.overallPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-fill" style={{ width: `${Math.max(pf.overallPercent, 3)}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {pf.best ? `Best so far: ${pf.best.modelName}` : 'No model has passed yet.'}
              </p>
              <button type="button" onClick={pf.stop} className={outlineBtn}>
                <Square className="h-3.5 w-3.5" aria-hidden /> Stop and keep the best so far
              </button>
            </div>
          </div>
        )}

        {pf.phase === 'done' && (
          <div className={`animate-slide-up mt-6 rounded-2xl border p-5 backdrop-blur ${pf.best ? 'border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30' : 'border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30'}`}>
            <div className="flex items-start gap-3">
              {pf.best ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              )}
              <div className="min-w-0">
                {pf.best ? (
                  <>
                    <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Best model: {pf.best.modelName}</p>
                    <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                      About {pf.best.sizeGb} GB{speedLabel(pf.best.tokensPerSecond) ? ` · ${speedLabel(pf.best.tokensPerSecond)} replies on this device` : ''}.
                      {pf.stopped ? ' You stopped the test early, so a larger model might also work.' : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">
                    {deviceChecks.find((c) => c.status === 'failed')?.reason ??
                      (pf.stopped ? 'The test was stopped before any model finished.' : 'None of the tested models could load and reply on this device.')}
                  </p>
                )}
                {modelChecks.length > 0 && (
                  <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {passed.length} passed · {failed.length} failed · {modelChecks.length - passed.length - failed.length} not tested
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {pf.best && (
                <button type="button" onClick={() => void proceed()} className="btn-grad">
                  Start chatting with {pf.best.modelName} <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
              <button type="button" onClick={() => void prepare()} className={outlineBtn}>
                <RefreshCw className="h-4 w-4" aria-hidden /> Run the check again
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <PreflightChecklist title="Device" checks={deviceChecks} bestModelId={null} />
          <PreflightChecklist title="Models, smallest first" checks={modelChecks} bestModelId={pf.phase === 'done' ? bestId : null} />
          {pf.log.length > 0 && <DebugLog entries={pf.log} />}
        </div>
      </div>
    </div>
  );
}
