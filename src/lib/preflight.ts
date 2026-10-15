export type CheckStatus = 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'skipped';

export interface LadderModel {
  /** Base id; the `q4f16_1` / `q4f32_1` suffix is chosen at runtime from GPU features. */
  baseId: string;
  name: string;
  paramsB: number;
  /** Approximate one-time download size. */
  sizeGb: number;
}

/** Test order, smallest first. Never reorder descending: the check must climb, not step down. */
export const PREFLIGHT_LADDER: readonly LadderModel[] = [
  { baseId: 'TinyLlama-1.1B-Chat-v1.0', name: 'TinyLlama 1.1B', paramsB: 1.1, sizeGb: 0.7 },
  { baseId: 'Qwen2.5-1.5B-Instruct', name: 'Qwen 2.5 1.5B', paramsB: 1.5, sizeGb: 1.0 },
  { baseId: 'gemma-2-2b-it', name: 'Gemma 2 2B', paramsB: 2.6, sizeGb: 1.6 },
  { baseId: 'Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B', paramsB: 3.2, sizeGb: 2.1 },
  { baseId: 'Phi-3.5-mini-instruct', name: 'Phi-3.5 Mini', paramsB: 3.8, sizeGb: 2.3 },
  { baseId: 'Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', paramsB: 7.2, sizeGb: 4.4 },
] as const;

export const MAX_DOWNLOAD_GB = { mobile: 2.3, desktop: 4.5 } as const;
export const MAX_CONSECUTIVE_FAILURES = 2;
export const LOW_MEMORY_GB = 4;
export const LOW_CORES = 4;

export interface ResolvedModel extends LadderModel {
  id: string;
  vramMb: number | null;
  available: boolean;
}

export interface MemoryInfo {
  deviceMemoryGb: number | null;
  jsHeapUsedMb: number | null;
  jsHeapLimitMb: number | null;
  storageFreeGb: number | null;
}

export interface DeviceReport {
  webgpu: { ok: boolean; adapterLabel: string | null; shaderF16: boolean; reason: string | null };
  memory: MemoryInfo & { low: boolean };
  cores: number | null;
  isMobile: boolean;
}

export type CheckKind = 'webgpu' | 'memory' | 'cpu' | 'storage' | 'model';

export interface CheckResult {
  key: string;
  kind: CheckKind;
  label: string;
  detail: string;
  status: CheckStatus;
  reason: string | null;
  model: ResolvedModel | null;
  cached: boolean;
  /** 0–100 while a model is downloading/initialising. */
  progress: number | null;
  stage: 'download' | 'inference' | null;
  durationMs: number | null;
  tokensPerSecond: number | null;
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface PreflightLogEntry {
  id: number;
  level: LogLevel;
  event: string;
  model: string | null;
  error: string | null;
  memoryInfo: MemoryInfo;
  timestamp: string;
}

export interface PreflightOutcome {
  modelId: string;
  modelName: string;
  sizeGb: number;
  tokensPerSecond: number | null;
  testedAt: string;
}

const RESULT_KEY = 'lmp:preflight';

export function saveOutcome(outcome: PreflightOutcome | null): void {
  try {
    if (outcome) localStorage.setItem(RESULT_KEY, JSON.stringify(outcome));
    else localStorage.removeItem(RESULT_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadOutcome(): PreflightOutcome | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PreflightOutcome>;
    if (typeof parsed.modelId !== 'string' || typeof parsed.modelName !== 'string') return null;
    return {
      modelId: parsed.modelId,
      modelName: parsed.modelName,
      sizeGb: typeof parsed.sizeGb === 'number' ? parsed.sizeGb : 0,
      tokensPerSecond: typeof parsed.tokensPerSecond === 'number' ? parsed.tokensPerSecond : null,
      testedAt: typeof parsed.testedAt === 'string' ? parsed.testedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Friendly name for any ladder model id (both f16 and f32 variants). */
export function ladderNameFor(modelId: string): string | null {
  return PREFLIGHT_LADDER.find((m) => modelId.startsWith(`${m.baseId}-q4`))?.name ?? null;
}

export async function readMemoryInfo(): Promise<MemoryInfo> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
  let storageFreeGb: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota != null) storageFreeGb = Math.round(((est.quota - (est.usage ?? 0)) / 1024 ** 3) * 10) / 10;
  } catch {
    /* estimate unavailable */
  }
  return {
    deviceMemoryGb: nav.deviceMemory ?? null,
    jsHeapUsedMb: perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1024 ** 2) : null,
    jsHeapLimitMb: perf.memory ? Math.round(perf.memory.jsHeapSizeLimit / 1024 ** 2) : null,
    storageFreeGb,
  };
}

interface GpuAdapterLike {
  features: { has(name: string): boolean };
  info?: { vendor?: string; architecture?: string; description?: string };
}

export function detectMobile(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (typeof nav.userAgentData?.mobile === 'boolean') return nav.userAgentData.mobile;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iPadOS || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export async function scanDevice(): Promise<DeviceReport> {
  const memory = await readMemoryInfo();
  const webgpu: DeviceReport['webgpu'] = { ok: false, adapterLabel: null, shaderF16: false, reason: null };
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(o?: object): Promise<GpuAdapterLike | null> } }).gpu;
  if (!gpu) {
    webgpu.reason = 'This browser does not support WebGPU.';
  } else {
    try {
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) {
        webgpu.reason = 'WebGPU is present but no compatible graphics adapter was found.';
      } else {
        webgpu.ok = true;
        webgpu.shaderF16 = adapter.features.has('shader-f16');
        const info = adapter.info;
        const label = [info?.vendor, info?.architecture].filter(Boolean).join(' ');
        webgpu.adapterLabel = label || info?.description || 'WebGPU graphics adapter';
      }
    } catch (err) {
      webgpu.reason = `Requesting a graphics adapter failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  const low = memory.deviceMemoryGb !== null && memory.deviceMemoryGb <= LOW_MEMORY_GB;
  return { webgpu, memory: { ...memory, low }, cores: navigator.hardwareConcurrency ?? null, isMobile: detectMobile() };
}

function check(partial: Pick<CheckResult, 'key' | 'kind' | 'label' | 'detail' | 'status'> & Partial<CheckResult>): CheckResult {
  return {
    reason: null,
    model: null,
    cached: false,
    progress: null,
    stage: null,
    durationMs: null,
    tokensPerSecond: null,
    ...partial,
  };
}

export function deviceChecks(report: DeviceReport): CheckResult[] {
  const { webgpu, memory, cores } = report;
  const memParts = [
    memory.deviceMemoryGb !== null ? `${memory.deviceMemoryGb}${memory.deviceMemoryGb >= 8 ? '+' : ''} GB device memory` : null,
    memory.jsHeapLimitMb !== null ? `${memory.jsHeapLimitMb} MB browser heap limit` : null,
  ].filter(Boolean);

  return [
    check({
      key: 'webgpu',
      kind: 'webgpu',
      label: 'WebGPU graphics acceleration',
      detail: webgpu.ok
        ? `${webgpu.adapterLabel}${webgpu.shaderF16 ? '' : ' · using full-precision models (no 16-bit shader support)'}`
        : 'Needed to run AI models in the browser',
      status: webgpu.ok ? 'passed' : 'failed',
      reason: webgpu.reason,
    }),
    check({
      key: 'memory',
      kind: 'memory',
      label: 'Memory',
      detail: memParts.length ? memParts.join(' · ') : 'This browser does not report memory size',
      status: memory.low ? 'warning' : 'passed',
      reason: memory.low ? `Low memory (${memory.deviceMemoryGb} GB). Larger models will be skipped.` : null,
    }),
    check({
      key: 'cpu',
      kind: 'cpu',
      label: 'Processor',
      detail: cores !== null ? `${cores} logical cores` : 'Core count not reported',
      status: cores !== null && cores < LOW_CORES ? 'warning' : 'passed',
      reason: cores !== null && cores < LOW_CORES ? 'Few processor cores — setup may be slower.' : null,
    }),
    check({
      key: 'storage',
      kind: 'storage',
      label: 'Free storage',
      detail: memory.storageFreeGb !== null ? `About ${memory.storageFreeGb} GB available to this app` : 'Storage size not reported',
      status: memory.storageFreeGb !== null && memory.storageFreeGb < PREFLIGHT_LADDER[0].sizeGb * 1.2 ? 'failed' : 'passed',
      reason:
        memory.storageFreeGb !== null && memory.storageFreeGb < PREFLIGHT_LADDER[0].sizeGb * 1.2
          ? 'Not enough space to download even the smallest model.'
          : null,
    }),
  ];
}

/** Decide which ladder models to test and why any are skipped. Order is preserved (ascending). */
export function planModelChecks(report: DeviceReport, models: ResolvedModel[], cachedIds: Set<string>): CheckResult[] {
  const maxGb = report.isMobile ? MAX_DOWNLOAD_GB.mobile : MAX_DOWNLOAD_GB.desktop;
  // deviceMemory is capped at 8 by browsers, so only treat smaller values as a real limit.
  const devMem = report.memory.deviceMemoryGb;
  const maxVramMb = devMem !== null && devMem < 8 ? devMem * 1024 * 0.6 : null;
  let storageLeft = report.memory.storageFreeGb;

  return models.map((m) => {
    const cached = cachedIds.has(m.id);
    let reason: string | null = null;
    if (!report.webgpu.ok) reason = 'Skipped — WebGPU is not available.';
    else if (!m.available) reason = 'Not offered by this version of the AI engine.';
    else if (m.sizeGb > maxGb) reason = `Above the ${maxGb} GB limit for ${report.isMobile ? 'phones and tablets' : 'this device'}.`;
    else if (maxVramMb !== null && m.vramMb !== null && m.vramMb > maxVramMb)
      reason = `Needs about ${(m.vramMb / 1024).toFixed(1)} GB of memory; this device reports ${devMem} GB.`;
    else if (!cached && storageLeft !== null && m.sizeGb * 1.1 > storageLeft) reason = 'Not enough free storage to download it.';

    if (!reason && !cached && storageLeft !== null) storageLeft -= m.sizeGb;
    return check({
      key: `model:${m.id}`,
      kind: 'model',
      label: m.name,
      detail: `${m.paramsB}B parameters · ~${m.sizeGb} GB${cached ? ' · already downloaded' : ''}`,
      status: reason ? 'skipped' : 'pending',
      reason,
      model: m,
      cached,
    });
  });
}

export function plannedDownloadGb(checks: CheckResult[]): number {
  const total = checks
    .filter((c) => c.kind === 'model' && c.status === 'pending' && !c.cached)
    .reduce((sum, c) => sum + (c.model?.sizeGb ?? 0), 0);
  return Math.round(total * 10) / 10;
}
