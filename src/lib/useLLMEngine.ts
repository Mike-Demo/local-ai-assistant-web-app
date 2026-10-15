import { useEffect, useState } from 'react';
import { sharedEngine, type EngineStats, type EngineStatus, type LoadProgress } from './sharedEngine';
import type { ErrorCategory } from './errorHandling';

export type { EngineStats, EngineStatus, LoadProgress };

/**
 * Thin React binding over the shared engine singleton. Multiple components
 * (main chat, assistant) can use this simultaneously — they all observe the
 * same single model instance.
 */
export function useLLMEngine() {
  const [snapshot, setSnapshot] = useState({
    status: sharedEngine.status as EngineStatus,
    progress: sharedEngine.progress as LoadProgress | null,
    error: sharedEngine.error as string | null,
    errorCategory: sharedEngine.errorCategory as ErrorCategory | null,
    stats: sharedEngine.stats as EngineStats,
  });

  useEffect(
    () =>
      sharedEngine.subscribe((status, progress, error, errorCategory, stats) => {
        setSnapshot({ status, progress, error, errorCategory, stats });
      }),
    []
  );

  return {
    ...snapshot,
    loadModel: sharedEngine.loadModel.bind(sharedEngine),
    generate: sharedEngine.generate.bind(sharedEngine),
    interrupt: sharedEngine.interrupt.bind(sharedEngine),
    resetChat: sharedEngine.resetChat.bind(sharedEngine),
  };
}
