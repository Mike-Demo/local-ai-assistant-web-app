import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Cpu, ExternalLink, Gauge, Menu, MemoryStick, Send, Square, Trash2, X } from 'lucide-react';
import { BETA_TERMS_PATH } from '@/lib/beta';
import { OPEN_SOURCE_PATH } from '@/lib/site';
import { useLLMEngine } from '../lib/useLLMEngine';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { speedLabel } from '@/lib/speedLabel';
import { BitLogo } from '@/components/privacyTips/BitLogo';
import { usePrivacyTips } from '@/components/privacyTips/privacyTipsContext';
import { buildSystemPrompt, loadPrefs, type OnboardingPrefs } from '../lib/onboarding';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const TOKEN_FLUSH_MS = 50;
const USER_BUBBLE = 'linear-gradient(120deg, #6a4f94, #2f6fb5 60%, #0a7f9a)';

export default function Chat({
  modelName,
  onOpenAdvanced,
}: {
  modelName: string;
  onOpenAdvanced: () => void;
}) {
  const engine = useLLMEngine();
  const [prefs] = useState<OnboardingPrefs>(() => loadPrefs());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || engine.status === 'generating') return;
    setInput('');
    setAnnouncement('Generating a reply…');
    const history: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);

    let reply = '';
    let flushTimer: number | null = null;
    const flush = () => {
      flushTimer = null;
      setMessages([...history, { role: 'assistant', content: reply }]);
    };
    const result = await engine.generate(history, buildSystemPrompt(prefs), 0.7, (chunk) => {
      reply += chunk;
      if (flushTimer === null) flushTimer = window.setTimeout(flush, TOKEN_FLUSH_MS);
    });
    if (flushTimer !== null) window.clearTimeout(flushTimer);
    setMessages([...history, { role: 'assistant', content: reply }]);
    setAnnouncement(reply ? `Reply: ${reply}` : result.aborted ? 'Stopped.' : 'No reply was generated.');
  };

  const busy = engine.status === 'generating' || engine.status === 'loading';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="relative z-30 flex items-center gap-2 border-b border-neutral-200/60 bg-white/70 px-4 py-2.5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
        <button onClick={onOpenAdvanced} className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800" aria-label="Open advanced panel">
          <Menu className="h-4.5 w-4.5" aria-hidden />
        </button>
        <BitLogo showName={false} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{modelName}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">{engine.status === 'ready' ? 'Ready · on-device' : engine.status}</p>
        </div>
        <button
          onClick={async () => {
            await engine.resetChat();
            setMessages([]);
          }}
          disabled={messages.length === 0}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Trash2 className="h-3 w-3" aria-hidden /> New chat
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} role="region" aria-label="Conversation" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <div className="animate-float mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundImage: 'linear-gradient(120deg, #7B5EA7, #4A90D9, #00B4D8)' }}>
              <Cpu className="h-7 w-7 text-white" aria-hidden />
            </div>
            <p className="animate-slide-up mt-4 text-base font-semibold">Your private AI is ready</p>
            <p className="animate-fade-in mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Ask anything — every message stays on this device.
            </p>
          </div>
        )}
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`animate-fade-in max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white shadow-md'
                    : 'glass-card text-neutral-800 dark:text-neutral-100'
                }`}
                style={m.role === 'user' ? { backgroundImage: USER_BUBBLE } : {}}
              >
                <span className="sr-only">{m.role === 'user' ? 'You:' : 'Assistant:'} </span>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.content}{m.role === 'assistant' && busy && i === messages.length - 1 && <span className="animate-blink" aria-hidden>▍</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* Composer */}
      <div className="border-t border-neutral-200/60 bg-white/70 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
        {engine.status === 'error' && (
          <div role="alert" className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {engine.error}
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Send a message…"
            title="Enter to send, Shift+Enter for a new line"
            rows={1}
            aria-label="Message"
            className="scrollbar-thin max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/50 dark:border-neutral-700 dark:bg-neutral-900"
          />
          {engine.status === 'generating' ? (
            <button onClick={engine.interrupt} className="btn-grad !px-4" aria-label="Stop generating">
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button onClick={() => void send()} disabled={!input.trim()} className="btn-grad !px-4 disabled:opacity-40" aria-label="Send message">
              <Send className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdvancedDrawer({
  open,
  onClose,
  stats,
  status,
  models,
  currentModelId,
  onSwitchModel,
}: {
  open: boolean;
  onClose: () => void;
  stats: { tokensPerSecond: number | null; backend: string | null; activeModelId: string | null };
  status: string;
  models: { slug: string; name: string; webllm: { supported: boolean; id?: string } }[];
  currentModelId: string | null;
  onSwitchModel: (id: string) => void;
}) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const tips = usePrivacyTips();
  useFocusTrap(drawerRef, open, onClose);

  if (!open) return null;
  const webllmModels = models.filter((m) => m.webllm.supported);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Advanced panel">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside ref={drawerRef} className="animate-slide-in-right absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto scrollbar-thin border-l border-white/40 bg-white/85 p-5 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Gauge className="h-5 w-5 text-[#7B5EA7]" aria-hidden />
            Advanced
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800" aria-label="Close advanced panel">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <div className="glass-card p-3">
            <p className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400"><Cpu className="h-3 w-3" aria-hidden /> Backend</p>
            <p className="mt-1 font-semibold">{stats.backend ?? '—'}</p>
          </div>
          <div className="glass-card p-3">
            <p className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400"><Gauge className="h-3 w-3" aria-hidden /> Speed</p>
            <p className="mt-1 font-semibold">{speedLabel(stats.tokensPerSecond) ?? '—'}</p>
          </div>
          <div className="glass-card col-span-2 p-3">
            <p className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400"><MemoryStick className="h-3 w-3" aria-hidden /> Loaded model</p>
            <p className="mt-1 truncate font-semibold">{stats.activeModelId ?? 'None'}</p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold">Switch model</h3>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Switching downloads the new model (one time) and resets the chat.</p>
        <div className="mt-3 space-y-2">
          {webllmModels.map((m) => (
            <button
              key={m.slug}
              onClick={() => onSwitchModel(m.webllm.id!)}
              disabled={m.webllm.id === currentModelId}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                m.webllm.id === currentModelId
                  ? 'border-transparent text-white'
                  : 'border-neutral-200 bg-white/70 hover:border-[#4A90D9]/50 dark:border-neutral-700 dark:bg-white/5'
              }`}
              style={m.webllm.id === currentModelId ? { backgroundImage: USER_BUBBLE } : {}}
            >
              <span className="truncate font-medium">{m.name}</span>
              {m.webllm.id === currentModelId && <span className="ml-2 shrink-0 text-xs font-semibold uppercase tracking-wide">Active</span>}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            tips.openSettings();
          }}
          className="mt-6 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-left text-sm font-medium transition hover:border-[#4A90D9]/50 dark:border-neutral-700 dark:bg-white/5"
        >
          Privacy tip settings
          <span className="text-xs text-neutral-600 dark:text-neutral-400">{tips.prefs.enabled ? 'On' : 'Off'}</span>
        </button>

        <a
          href={BETA_TERMS_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-left text-sm font-medium transition hover:border-[#4A90D9]/50 dark:border-neutral-700 dark:bg-white/5"
        >
          Beta terms and disclaimer
          <ExternalLink className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" aria-hidden />
        </a>

        <a
          href={OPEN_SOURCE_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white/70 px-3 py-2.5 text-left text-sm font-medium transition hover:border-[#4A90D9]/50 dark:border-neutral-700 dark:bg-white/5"
        >
          Open source and credits
          <ExternalLink className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" aria-hidden />
        </a>

        <p className="mt-6 rounded-xl bg-neutral-100/70 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-400">
          Status: {status}. All processing stays on this device — nothing is sent to any server, and cached models can
          be cleared at any time from Advanced Settings on the landing page.
        </p>
      </aside>
    </div>
  );
}
