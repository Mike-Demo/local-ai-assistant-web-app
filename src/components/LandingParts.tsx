import { useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  Cpu,
  Database,
  Download,
  Gauge,
  HardDrive,
  Lock,
  Settings,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import type { CatalogModel } from '../lib/catalogTypes';
import { useHardwareDetect } from '../hooks/useHardwareDetect';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { deviceSummary, recommendModel, type DeviceCapability } from '../lib/deviceCapability';
import { ladderNameFor } from '@/lib/preflight';
import { usePrivacyTips } from '@/components/privacyTips/privacyTipsContext';

const TRUST_BADGES: { icon: typeof Lock; label: string }[] = [
  { icon: Lock, label: '100% On-Device' },
  { icon: Zap, label: 'No Account Needed' },
  { icon: Sparkles, label: 'Open Source' },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {TRUST_BADGES.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
        >
          <Icon className="h-3.5 w-3.5 text-[#7B5EA7]" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}

export function DeviceRecommendation({
  models,
  capability,
  selectedModelId,
  onUseRecommended,
}: {
  models: CatalogModel[];
  capability: DeviceCapability | null;
  selectedModelId: string;
  onUseRecommended: (id: string) => void;
}) {
  if (!capability?.detected) return null;
  const rec = recommendModel(capability, models);
  if (!rec?.webllm.id || rec.webllm.id === selectedModelId) return null;
  return (
    <button
      onClick={() => onUseRecommended(rec.webllm.id!)}
      className="animate-slide-up inline-flex items-center gap-2 rounded-full border border-[#7B5EA7]/30 bg-[#7B5EA7]/10 px-4 py-2 text-xs font-medium text-[#7B5EA7] transition hover:bg-[#7B5EA7]/20 dark:text-[#c4b1e0]"
    >
      <BadgeCheck className="h-4 w-4" aria-hidden />
      Recommended for your device: {rec.name} (~{rec.sizeGb} GB) — use it
    </button>
  );
}

export function AdvancedSection({
  models,
  capability,
  selectedModelId,
  onSelectModel,
  onGetStarted,
  startDisabled = false,
  onRecheck,
}: {
  models: CatalogModel[];
  capability: DeviceCapability | null;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onGetStarted: () => void;
  startDisabled?: boolean;
  onRecheck: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hw = useHardwareDetect();
  const online = useOnlineStatus();
  const [cacheCleared, setCacheCleared] = useState(false);
  const tips = usePrivacyTips();

  const webllmModels = models.filter((m) => m.webllm.supported);

  const handleClearCache = async () => {
    if (window.caches) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    }
    setCacheCleared(true);
  };

  return (
    <div className="w-full max-w-md">
      {!open ? (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="advanced-settings-panel"
          className="mx-auto flex items-center gap-1 text-xs font-medium text-neutral-600 transition hover:text-[#7B5EA7] dark:text-neutral-400"
        >
          Advanced Settings
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <div id="advanced-settings-panel" className="glass-card animate-slide-up w-full p-5 text-left">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-[#7B5EA7]" aria-hidden />
              Advanced Settings
            </h3>
            <button onClick={() => setOpen(false)} className="text-xs text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
              Collapse
            </button>
          </div>

          <label className="mt-4 block text-xs font-medium text-neutral-600 dark:text-neutral-300">Model</label>
          <select
            value={selectedModelId}
            onChange={(e) => onSelectModel(e.target.value)}
            aria-label="Select model"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/50 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {!webllmModels.some((m) => m.webllm.id === selectedModelId) && (
              <option value={selectedModelId}>{ladderNameFor(selectedModelId) ?? selectedModelId} — tested on this device</option>
            )}
            {webllmModels.map((m) => (
              <option key={m.slug} value={m.webllm.id!}>
                {m.name} — {m.paramsB}B, ~{m.sizeGb} GB
              </option>
            ))}
          </select>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/70 p-2.5 dark:bg-neutral-800/70">
              <p className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
                <Cpu className="h-3 w-3" aria-hidden /> GPU
              </p>
              <p className="mt-0.5 truncate font-semibold" title={hw.displayLabel}>
                {capability ? deviceSummary(capability) : hw.detected ? (hw.webgpuAvailable ? 'WebGPU ready' : 'Not available') : 'Detecting…'}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 p-2.5 dark:bg-neutral-800/70">
              <p className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
                <HardDrive className="h-3 w-3" aria-hidden /> Memory
              </p>
              <p className="mt-0.5 font-semibold">
                {hw.memoryGb ? `${hw.memoryGb} GB` : hw.cores ? `${hw.cores} threads` : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            {online ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : <WifiOff className="h-3.5 w-3.5" aria-hidden />}
            {online
              ? 'Online — first load downloads the model; afterwards it works offline.'
              : 'Offline — you can use any model already downloaded.'}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-neutral-800/70">
            <div className="flex items-center gap-2 text-xs">
              <Database className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" aria-hidden />
              <span className="text-neutral-600 dark:text-neutral-300">Cached model data</span>
            </div>
            <div className="flex items-center gap-2">
              {cacheCleared && <span role="status" className="text-xs text-emerald-700 dark:text-emerald-400">Cleared</span>}
              <button
                onClick={handleClearCache}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3 w-3" aria-hidden /> Clear
              </button>
            </div>
          </div>

          <button
            onClick={onRecheck}
            disabled={startDisabled}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#245a96] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-300"
          >
            <Gauge className="h-3.5 w-3.5" aria-hidden /> Re-check my device
          </button>
          <button
            onClick={tips.openSettings}
            className="ml-4 mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#245a96] underline-offset-2 hover:underline dark:text-sky-300"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden /> Privacy tip settings
          </button>

          <button onClick={onGetStarted} disabled={startDisabled} className="btn-grad mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
            <Download className="h-4 w-4" aria-hidden />
            Continue with this model
          </button>
        </div>
      )}
    </div>
  );
}
