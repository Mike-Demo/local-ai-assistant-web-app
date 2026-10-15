import { useEffect, useState } from 'react';
import type { HardwareClass } from '../lib/catalogTypes';

interface HardwareInfo {
  className: HardwareClass;
  displayLabel: string;
  memoryGb: number | null;
  cores: number | null;
  webgpuAvailable: boolean;
  detected: boolean;
}

interface AdapterInfoLike {
  vendor?: string;
  architecture?: string;
}

interface GpuNavigator {
  deviceMemory?: number;
  gpu?: {
    requestAdapter(): Promise<{ info?: AdapterInfoLike; requestAdapterInfo?: () => Promise<AdapterInfoLike> } | null>;
  };
}

export function useHardwareDetect(): HardwareInfo {
  const [info, setInfo] = useState<HardwareInfo>({
    className: 'cpu',
    displayLabel: 'Detecting hardware…',
    memoryGb: null,
    cores: null,
    webgpuAvailable: false,
    detected: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      const nav = navigator as Navigator & GpuNavigator;
      const memoryGb = nav.deviceMemory ?? null;
      const cores = navigator.hardwareConcurrency ?? null;
      let className: HardwareClass = 'cpu';
      let displayLabel = 'CPU only';
      let webgpu = false;

      try {
        const gpu = nav.gpu;
        if (gpu) {
          webgpu = true;
          const adapter = await gpu.requestAdapter();
          const infoObj = adapter?.info ?? (await adapter?.requestAdapterInfo?.());
          const vendor = infoObj?.vendor ?? '';
          const arch = infoObj?.architecture ?? '';
          const label = vendor && arch ? `${vendor} ${arch}` : 'WebGPU-capable GPU';
          displayLabel = label;
          if (/apple|metal/i.test(vendor + arch)) {
            className = 'apple-silicon';
          } else if (/nvidia|geforce|rtx/i.test(vendor + arch)) {
            className = 'nvidia-gpu';
          } else if (/amd|radeon/i.test(vendor + arch)) {
            className = 'amd-gpu';
          } else {
            className = 'webgpu';
          }
        } else if (cores !== null && cores >= 16) {
          displayLabel = `CPU (${cores} threads)`;
        }
      } catch {
        /* fall back to CPU */
      }
      if (!cancelled) {
        setInfo({ className, displayLabel, memoryGb, cores, webgpuAvailable: webgpu, detected: true });
      }
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
