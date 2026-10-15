import { useEffect, useState } from 'react';
import { AlertTriangle, BatteryMedium, Lock, RefreshCw, Settings2, ShieldCheck, WifiOff } from 'lucide-react';
import { detectMobile } from '@/lib/preflight';
import type { LoadProgress } from '../lib/useLLMEngine';
import { FRIENDLY_MESSAGES, type ErrorCategory } from '../lib/errorHandling';

const ROTATING_MESSAGES = [
  'Keeping your data on-device',
  'No cloud, no tracking',
  'Optimizing for your hardware',
  'Almost ready…',
];

export default function ModelLoading({
  progress,
  modelName,
  error,
  onRetry,
  onTrySmaller,
  onBackToSettings,
  hasSmaller,
}: {
  progress: LoadProgress | null;
  modelName: string;
  error: { category: ErrorCategory | null; message: string | null } | null;
  onRetry: () => void;
  onTrySmaller?: () => void;
  onBackToSettings: () => void;
  hasSmaller: boolean;
}) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setMsgIdx((i) => (i + 1) % ROTATING_MESSAGES.length), 2600);
    return () => window.clearInterval(t);
  }, []);

  const percent = error ? 0 : (progress?.percent ?? 0);
  const mbTotal = progress?.totalBytes ? Math.round(progress.totalBytes / 1024 ** 2) : null;
  const mbLoaded = progress?.loadedBytes ? Math.round(progress.loadedBytes / 1024 ** 2) : null;
  const mbps = progress?.bytesPerSecond ? (progress.bytesPerSecond / 1024 ** 2).toFixed(1) : null;
  const etaMin = progress?.etaSeconds != null ? Math.max(Math.round(progress.etaSeconds / 60), 1) : null;

  if (error) {
    return (
      <LoadErrorPanel
        category={error.category}
        message={error.message}
        modelName={modelName}
        onRetry={onRetry}
        onTrySmaller={onTrySmaller}
        onBackToSettings={onBackToSettings}
        hasSmaller={hasSmaller}
      />
    );
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 animate-float rounded-full bg-[#4A90D9]/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 animate-float-delayed rounded-full bg-[#7B5EA7]/20 blur-3xl" aria-hidden />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="animate-fade-in inline-flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundImage: 'linear-gradient(120deg, #7B5EA7, #4A90D9, #00B4D8)' }}>
          <ShieldCheck className="h-8 w-8 text-white" aria-hidden />
        </div>

        <h1 className="animate-slide-up mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Setting up your private AI…</h1>
        <p className="animate-slide-up mt-2 text-sm text-neutral-600 dark:text-neutral-400" style={{ animationDelay: '80ms' }}>
          Downloading {modelName} to your device. This happens once.
        </p>

        <div className="mt-8">
          <div className="progress-track shimmer" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${Math.max(percent, 4)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>{percent}%</span>
            {mbTotal ? (
              <span>
                {mbLoaded ?? 0} / {mbTotal} MB{mbps ? ` · ${mbps} MB/s` : ''}{etaMin ? ` · ~${etaMin} min left` : ''}
              </span>
            ) : (
              <span>Preparing…</span>
            )}
          </div>
        </div>

        <div className="mt-8 flex h-6 items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-300" aria-live="polite">
          <span key={msgIdx} className="animate-fade-in">{ROTATING_MESSAGES[msgIdx]}</span>
        </div>

        <div className="mt-8 space-y-2 rounded-2xl border border-white/50 bg-white/60 p-4 text-left text-xs text-neutral-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
          <p className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 shrink-0 text-[#7B5EA7]" aria-hidden /> Your conversations never reach any server — the AI runs inside this tab.</p>
          <p className="flex items-center gap-2"><WifiOff className="h-3.5 w-3.5 shrink-0 text-[#4A90D9]" aria-hidden /> After this download, everything works offline.</p>
          {detectMobile() && (
            <p className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200"><BatteryMedium className="h-3.5 w-3.5 shrink-0" aria-hidden /> On a phone? Stay on Wi-Fi and keep this tab open; plugging in helps too.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadErrorPanel({
  category,
  message,
  modelName,
  onRetry,
  onTrySmaller,
  onBackToSettings,
  hasSmaller,
}: {
  category: ErrorCategory | null;
  message: string | null;
  modelName: string;
  onRetry: () => void;
  onTrySmaller?: () => void;
  onBackToSettings: () => void;
  hasSmaller: boolean;
}) {
  const friendly = category ? FRIENDLY_MESSAGES[category] : FRIENDLY_MESSAGES.unknown;
  const isOom = category === 'oom';
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="animate-fade-in mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <AlertTriangle className="h-7 w-7 text-amber-500" aria-hidden />
        </div>
        <h1 className="animate-slide-up mt-5 text-2xl font-bold tracking-tight">Couldn't load {modelName}</h1>
        <p className="animate-slide-up mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300" style={{ animationDelay: '60ms' }}>
          {friendly}
        </p>
        {isOom && (
          <p className="animate-fade-in mt-2 text-xs text-neutral-600 dark:text-neutral-400" style={{ animationDelay: '120ms' }}>
            A smaller model answers slightly less accurately but loads reliably and runs faster on this device.
          </p>
        )}
        <div className="mt-7 flex flex-col gap-2.5">
          {hasSmaller && onTrySmaller && (
            <button onClick={onTrySmaller} className="btn-grad w-full">
              <Settings2 className="h-4 w-4" aria-hidden />
              Try a smaller model
            </button>
          )}
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-white dark:border-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-200"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </button>
          <button onClick={onBackToSettings} className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200">
            Choose a different model in settings
          </button>
        </div>
        {message && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">Technical details</summary>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Only useful if you are reporting a problem. Nothing here is sent anywhere.</p>
            <p className="mt-1 break-words rounded-lg bg-neutral-100/70 p-2 text-xs text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300">
              {message.length > 240 ? `${message.slice(0, 240)}…` : message}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
