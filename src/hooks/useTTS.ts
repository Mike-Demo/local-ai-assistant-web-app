import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Text-to-speech via SpeechSynthesis. Reports speaking state so the avatar
 * can sync its talking animation to real speech boundaries.
 */
export function useTTS(enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!supported || !enabled) {
        onDone?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text.slice(0, 600));
      utter.rate = 1.05;
      utter.pitch = 1.1;
      utter.onstart = () => setSpeaking(true);
      utter.onboundary = () => setSpeaking(true);
      const finish = () => {
        setSpeaking(false);
        utterRef.current = null;
        onDone?.();
      };
      utter.onend = finish;
      utter.onerror = finish;
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [enabled, supported]
  );

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { supported, speaking, speak, stop };
}
