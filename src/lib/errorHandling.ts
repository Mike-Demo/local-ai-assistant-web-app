export type ErrorCategory = 'oom' | 'network' | 'gpu' | 'unknown';

export function categorizeError(err: unknown): ErrorCategory {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (m.includes('out of memory') || m.includes('oom') || m.includes('allocation') || m.includes('crash') || m.includes('abort(oob)')) return 'oom';
  if (m.includes('fetch') || m.includes('network') || m.includes('offline') || m.includes('failed to load')) return 'network';
  if (m.includes('webgpu') || m.includes('adapter') || m.includes('device lost') || m.includes('gpu')) return 'gpu';
  return 'unknown';
}

export const FRIENDLY_MESSAGES: Record<ErrorCategory, string> = {
  oom: 'This model needs more memory than this device has available. A smaller model will work well.',
  network: 'Your connection dropped. The download will resume where it left off once you\'re back online.',
  gpu: 'Your device\'s graphics processor couldn\'t run this model. This is common on older browsers.',
  unknown: 'Something went wrong while preparing the model. Retrying or picking a different model usually fixes it.',
};

const LOG_KEY = 'lmp:errorLog';
const MAX_LOG = 20;

export interface LogEntry {
  category: ErrorCategory;
  message: string;
  modelId: string | null;
  at: number;
}

export function logError(category: ErrorCategory, message: string, modelId: string | null): void {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const log: LogEntry[] = raw ? (JSON.parse(raw) as LogEntry[]) : [];
    log.unshift({ category, message: message.slice(0, 200), modelId, at: Date.now() });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG)));
  } catch {
    /* storage unavailable — logging is best-effort only */
  }
}

export function readErrorLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

// --- Crash-surviving load state -------------------------------------------

const LOAD_STATE_KEY = 'lmp:loadState';

export interface LoadState {
  modelId: string;
  startedAt: number;
}

export function markLoadStart(modelId: string): void {
  try {
    localStorage.setItem(LOAD_STATE_KEY, JSON.stringify({ modelId, startedAt: Date.now() } satisfies LoadState));
  } catch {
    /* ignore */
  }
}

export function markLoadSuccess(modelId: string): void {
  try {
    localStorage.removeItem(LOAD_STATE_KEY);
    localStorage.setItem('lmp:lastGoodModel', modelId);
  } catch {
    /* ignore */
  }
}

export function readInterruptedLoad(): LoadState | null {
  try {
    const raw = localStorage.getItem(LOAD_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as LoadState;
    return state.modelId ? state : null;
  } catch {
    return null;
  }
}

export function getLastGoodModel(): string | null {
  try {
    return localStorage.getItem('lmp:lastGoodModel') || null;
  } catch {
    return null;
  }
}
