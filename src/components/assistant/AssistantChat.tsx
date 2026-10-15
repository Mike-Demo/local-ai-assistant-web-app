import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, ShieldAlert, Square, Volume2, VolumeX } from 'lucide-react';
import { useAssistantMessages, useAssistantState } from './assistantContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useTTS } from '../../hooks/useTTS';

export function AssistantChat() {
  const messages = useAssistantMessages();
  const {
    send,
    busy,
    voiceEnabled,
    setVoiceEnabled,
    voiceInputConsent,
    setVoiceInputConsent,
    sttSupported,
    reportListening,
    reportSpeaking,
  } = useAssistantState();
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [showVoiceNotice, setShowVoiceNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tts = useTTS(voiceEnabled);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const doSend = async (text: string) => {
    if (!text.trim() || busy) return;
    setInput('');
    setAnnouncement('Bit is thinking…');
    const reply = await send(text);
    setAnnouncement(reply ? `Bit says: ${reply}` : 'Bit could not reply. Try again.');
    if (reply) {
      reportSpeaking(true);
      tts.speak(reply, () => reportSpeaking(false));
    }
  };

  const voice = useVoiceInput((text) => void doSend(text));
  useEffect(() => reportListening(voice.listening), [voice.listening, reportListening]);

  const onMicClick = () => {
    if (!voiceInputConsent) {
      setShowVoiceNotice(true);
      return;
    }
    voice.toggle();
  };

  const acceptVoice = () => {
    setVoiceInputConsent(true);
    setShowVoiceNotice(false);
    voice.start();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-3 py-2 dark:border-neutral-700/60">
        <p className="text-xs font-semibold">Bit — your on-device helper</p>
        <div className="flex items-center gap-1">
          {tts.supported && (
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              aria-label={voiceEnabled ? 'Turn off spoken replies' : 'Turn on spoken replies'}
              aria-pressed={voiceEnabled}
              className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        role="region"
        aria-label="Conversation with Bit"
        className="scrollbar-thin min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 && (
          <div className="glass-card animate-fade-in rounded-2xl px-3 py-2.5 text-sm leading-relaxed">
            Hi! I'm Bit. Ask me anything — about this app, or anything else. Everything stays on this device.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`animate-fade-in max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'text-white shadow-md' : 'glass-card text-neutral-800 dark:text-neutral-100'
              }`}
              style={m.role === 'user' ? { backgroundImage: 'linear-gradient(120deg, #6a4f94, #2f6fb5 60%, #0a7f9a)' } : {}}
            >
              <span className="sr-only">{m.role === 'user' ? 'You:' : 'Bit:'} </span>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {showVoiceNotice && (
        <div
          role="alertdialog"
          aria-labelledby="voice-notice-title"
          aria-describedby="voice-notice-body"
          className="animate-slide-up mx-2.5 mb-2 rounded-2xl border border-amber-300/70 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <p id="voice-notice-title" className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            Voice input may leave your device
          </p>
          <p id="voice-notice-body" className="mt-1">
            Your browser handles speech-to-text, and some browsers (such as Chrome) send the audio to their own online
            service to transcribe it. Typing keeps everything on this device. Spoken replies from Bit are always created
            locally.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={acceptVoice}
              autoFocus
              className="rounded-full bg-amber-900 px-3 py-1 font-semibold text-white transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
            >
              Use voice anyway
            </button>
            <button
              onClick={() => setShowVoiceNotice(false)}
              className="rounded-full px-3 py-1 font-semibold transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              Keep typing
            </button>
          </div>
        </div>
      )}

      {voice.error && (
        <p className="px-3 pb-1 text-xs text-amber-800 dark:text-amber-300" role="alert">
          {voice.error}
        </p>
      )}

      <div className="flex items-end gap-1.5 border-t border-neutral-200/60 p-2.5 dark:border-neutral-700/60">
        {sttSupported && (
          <button
            onClick={onMicClick}
            aria-label={voice.listening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={voice.listening}
            className={`rounded-xl p-2 transition ${
              voice.listening
                ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            {voice.listening ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void doSend(input);
            }
          }}
          placeholder={voice.listening ? 'Listening…' : 'Ask Bit anything…'}
          rows={1}
          aria-label="Message for Bit"
          className="scrollbar-thin max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/50 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {busy ? (
          <button
            onClick={() => import('../../lib/sharedEngine').then(({ sharedEngine }) => sharedEngine.interrupt())}
            className="btn-grad !px-3"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            onClick={() => void doSend(input)}
            disabled={!input.trim()}
            className="btn-grad !px-3 disabled:opacity-40"
            aria-label="Send message to Bit"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
