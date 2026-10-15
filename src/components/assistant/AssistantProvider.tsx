import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AssistantContext,
  AssistantMessagesContext,
  type AssistantContextValue,
  type AssistantMessage,
  type AssistantState,
} from './assistantContext';

const PREFS_KEY = 'lmp:assistant';
const IDLE_PROMPT_MS = 90_000;
const TOKEN_FLUSH_MS = 50;

interface AssistantPrefs {
  voiceEnabled: boolean;
  voiceInputConsent: boolean;
  welcomed: boolean;
}

const DEFAULT_PREFS: AssistantPrefs = { voiceEnabled: false, voiceInputConsent: false, welcomed: false };

function loadPrefs(): AssistantPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AssistantPrefs>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

const TTS_SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;
const STT_SUPPORTED =
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AssistantPrefs>(loadPrefs);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<AssistantState>('hidden');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [unreadHint, setUnreadHint] = useState<string | null>(null);
  const contextRef = useRef<{ page?: string; recentAction?: string }>({});
  const idleTimer = useRef<number | null>(null);
  const busyRef = useRef(false);
  const messagesRef = useRef<AssistantMessage[]>([]);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const commitMessages = (next: AssistantMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  };

  const savePrefs = useCallback((patch: Partial<AssistantPrefs>) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setContext = useCallback((ctx: { page?: string; recentAction?: string }) => {
    contextRef.current = { ...contextRef.current, ...ctx };
  }, []);

  const suggest = useCallback((text: string) => {
    setUnreadHint(text);
    setState((s) => (s === 'hidden' ? 'idle' : s));
  }, []);

  const dismissHint = useCallback(() => setUnreadHint(null), []);

  const send = useCallback(async (text: string): Promise<string | null> => {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    setUnreadHint(null);
    const history: AssistantMessage[] = [...messagesRef.current, { role: 'user', content: trimmed }];
    commitMessages([...history, { role: 'assistant', content: '' }]);
    setState('thinking');

    let reply = '';
    let flushTimer: number | null = null;
    const flush = () => {
      flushTimer = null;
      commitMessages([...history, { role: 'assistant', content: reply }]);
    };

    try {
      const [{ buildAssistantPrompt }, { sharedEngine }] = await Promise.all([
        import('../../lib/assistantLLM'),
        import('../../lib/sharedEngine'),
      ]);
      await sharedEngine.generate(history, buildAssistantPrompt(contextRef.current), 0.8, (chunk) => {
        reply += chunk;
        setState('speaking');
        if (flushTimer === null) flushTimer = window.setTimeout(flush, TOKEN_FLUSH_MS);
      });
      return reply;
    } catch {
      return null;
    } finally {
      if (flushTimer !== null) window.clearTimeout(flushTimer);
      flush();
      setState((s) => (s === 'hidden' ? s : 'idle'));
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  // One-time gentle idle prompt (only until the assistant has been opened once).
  useEffect(() => {
    if (prefs.welcomed) return;
    const schedule = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        if (!busyRef.current) {
          setUnreadHint('Need a hand? Tap me and ask anything — I run entirely on your device.');
          setState((s) => (s === 'hidden' ? 'idle' : s));
        }
      }, IDLE_PROMPT_MS);
    };
    schedule();
    window.addEventListener('pointerdown', schedule);
    window.addEventListener('keydown', schedule);
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      window.removeEventListener('pointerdown', schedule);
      window.removeEventListener('keydown', schedule);
    };
  }, [prefs.welcomed]);

  // Ctrl+/ (Cmd+/ on Mac) toggles the assistant.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen((o) => !o);
        setState((s) => (s === 'hidden' ? 'idle' : s));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const markWelcomed = useCallback(() => {
    if (!prefsRef.current.welcomed) savePrefs({ welcomed: true });
  }, [savePrefs]);

  const openAssistant = useCallback(() => {
    setOpen(true);
    setUnreadHint(null);
    setState('idle');
    markWelcomed();
  }, [markWelcomed]);

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setState('hidden');
  }, []);

  const setVoiceEnabled = useCallback((v: boolean) => savePrefs({ voiceEnabled: v }), [savePrefs]);
  const setVoiceInputConsent = useCallback((v: boolean) => savePrefs({ voiceInputConsent: v }), [savePrefs]);
  const reportListening = useCallback(
    (v: boolean) => setState((s) => (s === 'hidden' ? s : v ? 'listening' : 'idle')),
    []
  );
  const reportSpeaking = useCallback(
    (v: boolean) => setState((s) => (s === 'hidden' ? s : v ? 'speaking' : 'idle')),
    []
  );

  const value = useMemo<AssistantContextValue>(
    () => ({
      state,
      open,
      busy,
      voiceEnabled: prefs.voiceEnabled,
      voiceInputConsent: prefs.voiceInputConsent,
      welcomed: prefs.welcomed,
      unreadHint,
      ttsSupported: TTS_SUPPORTED,
      sttSupported: STT_SUPPORTED,
      openAssistant,
      closeAssistant,
      send,
      setVoiceEnabled,
      setVoiceInputConsent,
      reportListening,
      reportSpeaking,
      suggest,
      dismissHint,
      setContext,
      markWelcomed,
    }),
    [
      state,
      open,
      busy,
      prefs,
      unreadHint,
      openAssistant,
      closeAssistant,
      send,
      setVoiceEnabled,
      setVoiceInputConsent,
      reportListening,
      reportSpeaking,
      suggest,
      dismissHint,
      setContext,
      markWelcomed,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>
      <AssistantMessagesContext.Provider value={messages}>{children}</AssistantMessagesContext.Provider>
    </AssistantContext.Provider>
  );
}
