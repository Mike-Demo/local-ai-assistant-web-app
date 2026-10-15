import { ListFilter, Search } from 'lucide-react';
import { HARDWARE_OPTIONS } from '../lib/catalogTypes';
import type { HardwareFilter, LicenseTag, Provider, UseCase } from '../lib/catalogTypes';

type OptionValue = string;

export interface FilterState {
  search: string;
  provider: Provider | 'all';
  hardware: HardwareFilter;
  useCase: UseCase | 'all';
  license: LicenseTag | 'all';
  maxParams: number | 'all';
}

export function FilterBar({
  value,
  providers,
  onChange,
}: {
  value: FilterState;
  providers: Provider[];
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <ListFilter className="h-4 w-4 text-neutral-600 dark:text-neutral-400" aria-hidden />
        <span className="text-sm font-semibold">Filters</span>
      </div>
      <input
        type="search"
        placeholder="Search by name or provider…"
        aria-label="Search by model name or provider"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.currentTarget.value })}
        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <select
          aria-label="Provider"
          value={value.provider}
          onChange={(e) => onChange({ ...value, provider: e.target.value as Provider | 'all' })}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="all">Every provider</option>
          {(providers as string[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          aria-label="Hardware"
          value={value.hardware}
          onChange={(e) => onChange({ ...value, hardware: e.target.value as HardwareFilter })}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="all">Every hardware</option>
          {(HARDWARE_OPTIONS as { id: OptionValue; label: string }[]).map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Use case"
          value={value.useCase}
          onChange={(e) => onChange({ ...value, useCase: e.target.value as UseCase | 'all' })}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="all">Every use case</option>
          {['chat', 'code', 'reasoning', 'vision', 'creative'].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          aria-label="License"
          value={value.license}
          onChange={(e) => onChange({ ...value, license: e.target.value as FilterState['license'] })}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="all">Every license</option>
          {(['MIT', 'Apache 2.0', 'BSD-3', 'OpenRAIL-M', 'Llama', 'Gemma', 'Custom', 'NVIDIA Community'] as LicenseTag[]).map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <Search className="h-3 w-3" aria-hidden />
        <span>All filters run locally in your browser — no query ever leaves.</span>
      </div>
    </div>
  );
}
