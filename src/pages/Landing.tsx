import { useState } from 'react';
import { BetaAgreementDialog } from '@/components/BetaAgreementDialog';
import { BetaBadge } from '@/components/BetaBadge';
import { MobileWarning } from '@/components/MobileWarning';
import { acceptBetaTerms, BETA_TERMS_PATH, hasAcceptedBetaTerms } from '@/lib/beta';
import { detectMobile } from '@/lib/preflight';
import { AUTHOR, OPEN_SOURCE_PATH } from '@/lib/site';
import { ArrowRight, Gauge, Github, Leaf, MonitorX, ShieldCheck, Twitter } from 'lucide-react';
import { AdvancedSection, DeviceRecommendation, TrustBadges } from '@/components/LandingParts';
import { useCarbonEstimate } from '@/hooks/useCarbonEstimate';
import type { CatalogModel } from '@/lib/catalogTypes';
import type { DeviceCapability } from '@/lib/deviceCapability';
import type { PreflightOutcome } from '@/lib/preflight';

export default function Landing({
  models,
  capability,
  selectedModelId,
  onSelectModel,
  onGetStarted,
  onRunPreflight,
  preflightResult,
}: {
  models: CatalogModel[];
  capability: DeviceCapability | null;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onGetStarted: () => void;
  onRunPreflight: () => void;
  preflightResult: PreflightOutcome | null;
}) {
  const [leaving, setLeaving] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [isMobile] = useState(detectMobile);
  const noWebGpu = Boolean(capability?.detected && !capability.webgpu);
  const co2Grams = useCarbonEstimate();

  const requireAgreement = (action: () => void) => {
    if (hasAcceptedBetaTerms()) action();
    else setPending(() => action);
  };

  const start = () => {
    if (noWebGpu) return;
    requireAgreement(() => {
      setLeaving(true);
      onGetStarted();
    });
  };

  const runPreflight = () => requireAgreement(onRunPreflight);

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-[#7B5EA7]/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 animate-float-delayed rounded-full bg-[#4A90D9]/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 animate-float rounded-full bg-[#00B4D8]/20 blur-3xl" aria-hidden />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          <div className="animate-slide-up flex items-center justify-center gap-2">
            <BetaBadge withIcon />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7B5EA7]/25 bg-[#7B5EA7]/10 px-3.5 py-1 text-xs font-semibold text-[#6a4f94] dark:text-[#b9a3d8]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Private by design
            </span>
          </div>

          <h1 className="animate-slide-up mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ animationDelay: '80ms' }}>
            Your private AI,{' '}
            <span className="text-grad">right in your browser</span>
          </h1>

          <p className="animate-slide-up mx-auto mt-5 max-w-lg text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg" style={{ animationDelay: '160ms' }}>
            Chat with powerful open-source AI models that run entirely on your device.
            Nothing you type ever leaves your computer — no cloud, no accounts, no tracking.
          </p>

          <div className="animate-fade-in mt-8" style={{ animationDelay: '240ms' }}>
            <TrustBadges />
          </div>

          <div className="animate-slide-up mt-10 flex flex-col items-center gap-4" style={{ animationDelay: '320ms' }}>
            {isMobile && !noWebGpu && <MobileWarning />}
            {noWebGpu && (
              <div role="alert" className="flex max-w-md items-start gap-2.5 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
                <MonitorX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  <span className="font-semibold">This browser can't run on-device AI.</span> It needs WebGPU, which is
                  available in recent versions of Chrome, Edge and Safari on desktop. Try one of those, or update your
                  browser.
                </p>
              </div>
            )}
            <button
              onClick={start}
              disabled={leaving || noWebGpu}
              aria-describedby="setup-note"
              className="btn-grad text-base disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {leaving ? 'Preparing…' : 'Get Started'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            {!preflightResult && (
              <button
                onClick={runPreflight}
                disabled={noWebGpu}
                className="inline-flex items-center gap-2 rounded-full border border-[#2f6fb5]/40 bg-white/70 px-5 py-2 text-sm font-semibold text-[#245a96] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#2f6fb5]/70 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-white/5 dark:text-sky-200 dark:hover:bg-white/10"
              >
                <Gauge className="h-4 w-4" aria-hidden />
                Find the best model for my device
              </button>
            )}
            {preflightResult && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                Tested on this device: <span className="font-semibold">{preflightResult.modelName}</span> runs best.
              </p>
            )}
            <p id="setup-note" className="text-xs text-neutral-600 dark:text-neutral-400">
              First-time setup downloads the AI model (about 1–3 GB) — after that it works offline.
            </p>
            <AdvancedSection
              models={models}
              capability={capability}
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel}
              onGetStarted={start}
              startDisabled={noWebGpu}
              onRecheck={runPreflight}
            />
          </div>
          <div className="animate-fade-in mt-4 flex justify-center" style={{ animationDelay: '400ms' }}>
            <DeviceRecommendation
              models={models}
              capability={capability}
              selectedModelId={selectedModelId}
              onUseRecommended={(id) => onSelectModel(id)}
            />
          </div>
        </div>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-12 text-center">
        <h2 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
          New — <span className="text-grad">Build apps with local AI</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
          BoltLocal is the newest part of LocalModel Hub. Describe a small web app and a model running entirely in your
          browser writes the code — your prompts and your code never leave this device, and previews are blocked from
          the network.
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href="https://build.privatebrain.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-grad text-sm"
          >
            Try BoltLocal (beta)
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      <footer className="relative z-10 flex flex-col items-center gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-neutral-600 dark:text-neutral-400">
        <span>Beta · 100% local · Open source · No data leaves this device</span>
        <span aria-hidden>·</span>
        <a href={BETA_TERMS_PATH} className="font-semibold text-[#245a96] underline-offset-2 hover:underline dark:text-sky-200">
          Beta terms
        </a>
        <span aria-hidden>·</span>
        <a href={OPEN_SOURCE_PATH} className="font-semibold text-[#245a96] underline-offset-2 hover:underline dark:text-sky-200">
          Open source
        </a>
        <span aria-hidden>·</span>
        <a
          href="/carbon.txt"
          target="_blank"
          rel="noopener noreferrer"
          title="Machine-readable sustainability info for this site"
          className="inline-flex items-center gap-1 font-semibold text-[#245a96] underline-offset-2 hover:underline dark:text-sky-200"
        >
          <Leaf className="h-3 w-3" aria-hidden />
          carbon.txt
        </a>
        </div>
        {co2Grams !== null && (
          <p className="text-center text-xs text-neutral-600 dark:text-neutral-400">
            This visit ≈ {co2Grams < 0.01 ? co2Grams.toFixed(4) : co2Grams.toFixed(2)} g CO₂e · estimated with CO2.js (The Green Web Foundation) · AI chats run on your device.
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <span>
            Made by <span className="font-semibold text-neutral-800 dark:text-neutral-200">{AUTHOR.displayName}</span>
          </span>
          <a
            href={AUTHOR.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${AUTHOR.displayName} on GitHub (opens in a new tab)`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-200/70 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Github className="h-4 w-4" aria-hidden />
          </a>
          <a
            href={AUTHOR.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${AUTHOR.displayName} on X (opens in a new tab)`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-200/70 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Twitter className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </footer>

      {pending && (
        <BetaAgreementDialog
          onAccept={() => {
            acceptBetaTerms();
            const action = pending;
            setPending(null);
            action();
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
