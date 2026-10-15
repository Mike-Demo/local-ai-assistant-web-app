import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptCb = useRef(onTranscript);
  transcriptCb.current = onTranscript;

  const supported = getRecognitionCtor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Voice input isn\'t supported in this browser.');
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = navigator.language || 'en-US';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) text += e.results[i][0].transcript;
        }
        if (text.trim()) transcriptCb.current(text.trim());
      };
      rec.onend = () => setListening(false);
      rec.onerror = (ev) => {
        setListening(false);
        if (ev.error !== 'aborted') setError('Couldn\'t hear you — try again or type instead.');
      };
      recognitionRef.current = rec;
      setError(null);
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setError('Voice input couldn\'t start — try again or type instead.');
    }
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, error, start, stop, toggle: () => (listening ? stop() : start()) };
}
