export type HardwareClass = 'cpu' | 'webgpu' | 'apple-silicon' | 'nvidia-gpu' | 'amd-gpu' | 'intel-cpu';

export type UseCase = 'chat' | 'code' | 'reasoning' | 'vision' | 'creative';

export type LicenseTag = 'MIT' | 'Apache 2.0' | 'BSD-3' | 'OpenRAIL-M' | 'Llama' | 'Gemma' | 'Custom' | 'NVIDIA Community';

export type Quantization = 'INT4' | 'INT8' | 'FP16' | 'FP32' | 'BF16';

export type Provider =
  | 'Microsoft'
  | 'NVIDIA'
  | 'Meta'
  | 'Google'
  | 'Mistral'
  | 'DeepSeek'
  | 'Qwen'
  | 'SmolLM'
  | 'TinyLlama'
  | 'Razer-Optimized';

export interface ModelHardwareFit {
  badgeRole: { hardware: HardwareClass[]; notes: string };
  vramGb: number;
  ramGb?: number;
}

export interface QuantSpec {
  quant: Quantization;
  sizeGb: number;
}

export interface CatalogModel {
  slug: string;
  name: string;
  provider: Provider;
  paramsB: number;
  license: LicenseTag;
  hfUrl: string;
  sizeGb: number;
  quants: QuantSpec[];
  hardwareFit: ModelHardwareFit;
  useCases: UseCase[];
  recommendedVramGb: number;
  sortWeight: number;
  oneLiner: string;
  longBlurb: string;
  webllm: { supported: boolean; id?: string };
  benchmarks?: { device: string; tokensPerSecond: number }[];
  razerOfficial?: boolean;
}

export type HardwareFilter = 'all' | 'apple-silicon' | 'nvidia-gpu' | 'amd-gpu' | 'intel-cpu' | 'webgpu' | 'cpu';

export interface HardwarePreference {
  className: HardwareClass;
  display: string;
}

export const HARDWARE_OPTIONS: { id: HardwareClass; label: string }[] = [
  { id: 'cpu', label: 'Plain CPU' },
  { id: 'webgpu', label: 'WebGPU' },
  { id: 'apple-silicon', label: 'Apple Silicon' },
  { id: 'nvidia-gpu', label: 'NVIDIA GPU' },
  { id: 'amd-gpu', label: 'AMD GPU' },
  { id: 'intel-cpu', label: 'Intel CPU' },
];

export const RAZER_DISCLAIMER =
  'Razer does not publish official large language models. The entries below are third-party open-source models that run well on Razer GPU-accelerated workstations.' +
  ' They are not affiliated with, endorsed by, or sponsored by Razer Inc.';
