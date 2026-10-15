import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PRIVACY_TIPS, TIP_CATEGORIES, TIP_FREQUENCIES, type PrivacyTip, type TipCategoryId } from '@/data/privacyTips';
import { sharedEngine } from '@/lib/sharedEngine';
import { useAssistantState } from '@/hooks/useAssistant';
import { PrivacyTipsContext, type PrivacyTipsContextValue, type TipPrefs } from './privacyTipsContext';
import { TipSettingsPanel } from './TipSettingsPanel';

const PREFS_KEY = 'lmp:privacyTips';
const SHOWN_KEY = 'lmp:privacyTips:shown';
const SESSION_DONE_KEY = 'lmp:privacyTips:sessionDone';
const FIRST_TIP_MS = 60_000;
const TICK_MS = 1_000;
const TYPING_GRACE_MS = 5_000;
const EXIT_MS = 200;

const ALL_CATEGORIES = TIP_CATEGORIES.map((c) => c.id);
const DEFAULT_PREFS: TipPrefs = { enabled: true, frequency: '5m', categories: [...ALL_CATEGORIES] };

function loadPrefs(): TipPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<TipPrefs>;
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULT_PREFS.enabled,
      frequency: TIP_FREQUENCIES.some((f) => f.id === p.frequency) ? p.frequency! : DEFAULT_PREFS.frequency,
      categories: Array.isArray(p.categories)
        ? ALL_CATEGORIES.filter((id) => p.categories!.includes(id))
        : DEFAULT_PREFS.categories,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/** Pick a random tip from enabled categories, skipping ones already shown this session until all have been seen. */
function pickTip(categories: TipCategoryId[], excludeId: string | null): PrivacyTip | null {
  const pool = PRIVACY_TIPS.filter((t) => categories.includes(t.category));
  if (!pool.length) return null;
  let shown = readSession<string[]>(SHOWN_KEY, []);
  let fresh = pool.filter((t) => !shown.includes(t.id) && t.id !== excludeId);
  if (!fresh.length) {
    shown = excludeId ? [excludeId] : [];
    fresh = pool.filter((t) => t.id !== excludeId);
    if (!fresh.length) fresh = pool;
  }
  const tip = fresh[Math.floor(Math.random() * fresh.length)];
  writeSession(SHOWN_KEY, [...shown, tip.id]);
  return tip;
}

/** Quiet moment = nothing the user is focused on would be interrupted. */
function isUserBusy(lastKeyAt: number): boolean {
  if (document.hidden) return true;
  if (Date.now() - lastKeyAt < TYPING_GRACE_MS) return true;
  const el = document.activeElement;
  if ((el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) && el.value.trim() !== '') return true;
  if (document.querySelector('[aria-modal="true"]')) return true;
  return sharedEngine.status === 'loading' || sharedEngine.status === 'generating';
}

export function PrivacyTipsProvider({ children }: { children: ReactNode }) {
  const assistant = useAssistantState();
  const [prefs, setPrefs] = useState<TipPrefs>(loadPrefs);
  const [currentTip, setCurrentTip] = useState<PrivacyTip | null>(null);
  const [requested, setRequested] = useState(false);
  const [closing, setClosing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [pauseKeys, setPauseKeys] = useState<Set<string>>(() => new Set());

  const elapsedRef = useRef(0);
  const firstShownRef = useRef(false);
  const lastKeyRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);
  const currentRef = useRef<PrivacyTip | null>(null);
  currentRef.current = currentTip;

  const updatePrefs = useCallback((patch: Partial<TipPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
    elapsedRef.current = 0;
  }, []);

  const setPaused = useCallback((key: string, paused: boolean) => {
    setPauseKeys((prev) => {
      if (prev.has(key) === paused) return prev;
      const next = new Set(prev);
      if (paused) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const present = useCallback((tip: PrivacyTip, byUser: boolean) => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setClosing(false);
    setRequested(byUser);
    setCurrentTip(tip);
    setAnnouncement(`Privacy tip from Bit, ${tip.categoryLabel}: ${tip.message}`);
    elapsedRef.current = 0;
  }, []);

  const showTip = useCallback(() => {
    const tip = pickTip(prefs.categories, currentRef.current?.id ?? null);
    if (tip) present(tip, true);
    else setSettingsOpen(true);
  }, [prefs.categories, present]);

  const nextTip = useCallback(() => {
    const tip = pickTip(prefs.categories, currentRef.current?.id ?? null);
    if (tip) present(tip, requested);
  }, [prefs.categories, present, requested]);

  const dismissTip = useCallback(() => {
    if (!currentRef.current || closeTimerRef.current !== null) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setCurrentTip(null);
      setClosing(false);
      setRequested(false);
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    const onKey = () => {
      lastKeyRef.current = Date.now();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // Automatic tips: count visible, unpaused seconds; show at the next quiet moment once due.
  const intervalMs = TIP_FREQUENCIES.find((f) => f.id === prefs.frequency)?.ms ?? null;
  const autoMode = prefs.enabled && prefs.frequency !== 'manual' && prefs.categories.length > 0;
  const blocked = pauseKeys.size > 0 || assistant.open || Boolean(assistant.unreadHint) || settingsOpen;

  useEffect(() => {
    if (!autoMode) return;
    const id = window.setInterval(() => {
      if (currentRef.current || document.hidden) return;
      elapsedRef.current += TICK_MS;
      const dueAt = firstShownRef.current ? intervalMs : FIRST_TIP_MS;
      if (dueAt === null || elapsedRef.current < dueAt) return;
      if (prefs.frequency === 'session' && readSession(SESSION_DONE_KEY, false)) return;
      if (blocked || isUserBusy(lastKeyRef.current)) return;
      const tip = pickTip(prefs.categories, null);
      if (!tip) return;
      firstShownRef.current = true;
      if (prefs.frequency === 'session') writeSession(SESSION_DONE_KEY, true);
      present(tip, false);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [autoMode, intervalMs, blocked, prefs.frequency, prefs.categories, present]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  const value = useMemo<PrivacyTipsContextValue>(
    () => ({
      prefs,
      updatePrefs,
      currentTip,
      requested,
      closing,
      showTip,
      nextTip,
      dismissTip,
      settingsOpen,
      openSettings: () => {
        dismissTip();
        setSettingsOpen(true);
      },
      closeSettings: () => setSettingsOpen(false),
      setPaused,
    }),
    [prefs, updatePrefs, currentTip, requested, closing, showTip, nextTip, dismissTip, settingsOpen, setPaused]
  );

  return (
    <PrivacyTipsContext.Provider value={value}>
      {children}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {settingsOpen && <TipSettingsPanel />}
    </PrivacyTipsContext.Provider>
  );
}
