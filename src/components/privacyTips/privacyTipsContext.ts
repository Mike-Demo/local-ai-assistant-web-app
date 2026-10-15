import { createContext, useContext, useEffect, useId } from 'react';
import type { PrivacyTip, TipCategoryId, TipFrequency } from '@/data/privacyTips';

export interface TipPrefs {
  enabled: boolean;
  frequency: TipFrequency;
  categories: TipCategoryId[];
}

export interface PrivacyTipsContextValue {
  prefs: TipPrefs;
  updatePrefs: (patch: Partial<TipPrefs>) => void;
  currentTip: PrivacyTip | null;
  /** True when the user asked for the tip (click), so the bubble may take focus. */
  requested: boolean;
  closing: boolean;
  showTip: () => void;
  nextTip: () => void;
  dismissTip: () => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  setPaused: (key: string, paused: boolean) => void;
}

export const PrivacyTipsContext = createContext<PrivacyTipsContextValue | null>(null);

export function usePrivacyTips(): PrivacyTipsContextValue {
  const ctx = useContext(PrivacyTipsContext);
  if (!ctx) throw new Error('usePrivacyTips must be used inside PrivacyTipsProvider');
  return ctx;
}

/** Hold automatic tips while `active` (e.g. during downloads or setup steps). */
export function usePauseTips(active: boolean): void {
  const { setPaused } = usePrivacyTips();
  const key = useId();
  useEffect(() => {
    setPaused(key, active);
    return () => setPaused(key, false);
  }, [active, key, setPaused]);
}
