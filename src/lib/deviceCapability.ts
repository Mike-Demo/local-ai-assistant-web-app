export interface DeviceCapability {
  approxRamGb: number | null;
  cores: number | null;
  webgpu: boolean;
  freeStorageGb: number | null;
  isIOS: boolean;
  detected: boolean;
}

export type ModelFit = 'comfortable' | 'tight' | 'risky' | 'unsupported';

const NO_WEBGPU_DEVICE = 'This device\'s browser can\'t run on-device AI yet (no WebGPU support).';

export async function detectCapability(): Promise<DeviceCapability> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const cores = navigator.hardwareConcurrency ?? null;
  const approxRamGb = nav.deviceMemory ?? null;

  let webgpu = false;
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown | null> } }).gpu;
    if (gpu) {
      const adapter = await gpu.requestAdapter();
      webgpu = adapter !== null;
    }
  } catch {
    webgpu = false;
  }

  let freeStorageGb: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota != null) freeStorageGb = Math.floor(est.quota / 1024 ** 3);
  } catch {
    /* estimate unavailable */
  }

  return { approxRamGb, cores, webgpu, freeStorageGb, isIOS, detected: true };
}

export function checkModelFit(cap: DeviceCapability, modelSizeGb: number): ModelFit {
  if (!cap.webgpu) return 'unsupported';
  // Loading can spike to ~2x the file size in RAM
  const ramNeeded = modelSizeGb * 2;
  if (cap.approxRamGb !== null && ramNeeded > cap.approxRamGb) return 'risky';
  if (cap.freeStorageGb !== null && modelSizeGb * 1.1 > cap.freeStorageGb) return 'risky';
  if (cap.approxRamGb !== null && ramNeeded > cap.approxRamGb * 0.7) return 'tight';
  return 'comfortable';
}

/** Pick the best model for the device from the WebLLM-capable list. Largest comfortable model wins. */
export function recommendModel<T extends { sizeGb: number; webllm: { supported: boolean; id?: string } }>(
  cap: DeviceCapability,
  models: T[]
): T | null {
  const candidates = models.filter((m) => m.webllm.supported);
  if (candidates.length === 0) return null;
  const fits = candidates
    .map((m) => ({ m, fit: checkModelFit(cap, m.sizeGb) }))
    .filter((x) => x.fit === 'comfortable' || x.fit === 'tight');
  if (fits.length === 0) return candidates[candidates.length - 1]; // smallest, for the "try anyway" path
  fits.sort((a, b) => b.m.sizeGb - a.m.sizeGb);
  return fits[0].m;
}

export function deviceSummary(cap: DeviceCapability): string {
  if (!cap.detected) return 'Checking your device…';
  if (!cap.webgpu) return NO_WEBGPU_DEVICE;
  const parts: string[] = [];
  if (cap.approxRamGb) parts.push(`${cap.approxRamGb} GB RAM`);
  else if (cap.cores) parts.push(`${cap.cores} threads`);
  if (cap.freeStorageGb !== null) parts.push(`${cap.freeStorageGb} GB free storage`);
  return parts.length ? parts.join(' · ') : 'WebGPU ready';
}
