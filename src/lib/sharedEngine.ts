import type * as WebLLM from '@mlc-ai/web-llm';
import { categorizeError, type ErrorCategory, logError, markLoadStart, markLoadSuccess } from './errorHandling';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export interface LoadProgress {
  text: string;
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  bytesPerSecond: number;
  etaSeconds: number | null;
}

export interface EngineStats {
  tokensPerSecond: number | null;
  backend: 'webgpu' | 'wasm' | null;
  activeModelId: string | null;
  memoryUsedGb: number | null;
}

function extractBytes(text: string): { loaded: number; total: number } | null {
  const match = text.match(/([\d.]+)\s*([MG])B\s*(?:\/|of)\s*([\d.]+)\s*([MG])B/i);
  if (!match) return null;
  const toBytes = (v: string, unit: string) =>
    parseFloat(v) * 1024 ** 3 * (unit.toUpperCase() === 'G' ? 1 : 1 / 1024);
  return { loaded: toBytes(match[1], match[2]), total: toBytes(match[3], match[4]) };
}

/**
 * Single shared MLCEngine for the whole app. The main chat and the assistant
 * both route through this, so only one model is ever loaded in memory.
 * Callers subscribe to status changes rather than owning the engine.
 */
class SharedEngine {
  private engine: WebLLM.MLCEngine | null = null;
  private loadToken = 0;
  private meta = { lastTime: 0, lastBytes: 0 };
  private listeners = new Set<(s: EngineStatus, p: LoadProgress | null, e: string | null, cat: ErrorCategory | null, stats: EngineStats) => void>();

  status: EngineStatus = 'idle';
  progress: LoadProgress | null = null;
  error: string | null = null;
  errorCategory: ErrorCategory | null = null;
  stats: EngineStats = { tokensPerSecond: null, backend: null, activeModelId: null, memoryUsedGb: null };

  subscribe(fn: (s: EngineStatus, p: LoadProgress | null, e: string | null, cat: ErrorCategory | null, stats: EngineStats) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.status, this.progress, this.error, this.errorCategory, this.stats);
  }

  private set(status: EngineStatus) {
    this.status = status;
    this.emit();
  }

  get isReady(): boolean {
    return this.status === 'ready' || this.status === 'generating';
  }

  async loadModel(modelId: string): Promise<boolean> {
    const token = ++this.loadToken;
    this.meta = { lastTime: performance.now(), lastBytes: 0 };
    this.progress = null;
    this.error = null;
    this.errorCategory = null;
    markLoadStart(modelId);
    this.set('loading');
    try {
      // Loaded on demand so the multi-megabyte runtime never blocks the landing page.
      const webllm = await import('@mlc-ai/web-llm');
      if (this.loadToken !== token) return false;
      const previous = this.engine;
      this.engine = null;
      this.stats = { ...this.stats, activeModelId: null };
      // Free the old model's GPU memory before downloading/initialising the next one.
      await previous?.unload().catch(() => undefined);
      const engine = new webllm.MLCEngine();
      engine.setInitProgressCallback((report: WebLLM.InitProgressReport) => {
        if (this.loadToken !== token) return;
        const bytes = extractBytes(report.text);
        const now = performance.now();
        let bytesPerSecond = 0;
        if (bytes) {
          bytesPerSecond = Math.max(bytes.loaded - this.meta.lastBytes, 0) / Math.max((now - this.meta.lastTime) / 1000, 0.001);
          this.meta = { lastTime: now, lastBytes: bytes.loaded };
        }
        this.progress = {
          text: report.text,
          percent: Math.min(100, Math.round(report.progress * 100)),
          loadedBytes: bytes?.loaded ?? 0,
          totalBytes: bytes?.total ?? 0,
          bytesPerSecond,
          etaSeconds:
            bytesPerSecond > 0 && bytes && bytes.total > bytes.loaded
              ? Math.round((bytes.total - bytes.loaded) / bytesPerSecond)
              : null,
        };
        this.emit();
      });
      await engine.reload(modelId);
      if (this.loadToken !== token) {
        await engine.unload().catch(() => undefined);
        return false;
      }
      this.engine = engine;
      this.progress = null;
      markLoadSuccess(modelId);
      this.stats = { tokensPerSecond: null, backend: 'webgpu', activeModelId: modelId, memoryUsedGb: null };
      this.set('ready');
      return true;
    } catch (err) {
      if (this.loadToken !== token) return false;
      const message = err instanceof Error ? err.message : String(err);
      this.error = message;
      this.errorCategory = categorizeError(err);
      logError(this.errorCategory, message, modelId);
      this.set('error');
      return false;
    }
  }

  /** Free GPU memory so another component (e.g. the preflight check) can load models. */
  async release(): Promise<void> {
    ++this.loadToken;
    const previous = this.engine;
    this.engine = null;
    this.progress = null;
    this.stats = { tokensPerSecond: null, backend: null, activeModelId: null, memoryUsedGb: null };
    this.set('idle');
    await previous?.unload().catch(() => undefined);
  }

  /** Take ownership of an engine that already has `modelId` loaded, avoiding a second load. */
  async adopt(engine: WebLLM.MLCEngine, modelId: string, tokensPerSecond: number | null): Promise<void> {
    ++this.loadToken;
    const previous = this.engine;
    if (previous && previous !== engine) await previous.unload().catch(() => undefined);
    await engine.resetChat().catch(() => undefined);
    this.engine = engine;
    this.progress = null;
    this.error = null;
    this.errorCategory = null;
    markLoadSuccess(modelId);
    this.stats = { tokensPerSecond, backend: 'webgpu', activeModelId: modelId, memoryUsedGb: null };
    this.set('ready');
  }

  /** Stream a completion; optional systemPrompt override lets the assistant use its own persona. */
  async generate(
    messages: { role: 'user' | 'assistant'; content: string }[],
    systemPrompt: string,
    temperature: number,
    onToken: (chunk: string) => void
  ): Promise<{ tps: number | null; aborted: boolean }> {
    const engine = this.engine;
    if (!engine) return { tps: null, aborted: false };
    this.set('generating');
    try {
      const chunks = await engine.chat.completions.create({
        messages: [
          { role: 'system' as const, content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature,
        stream: true,
        stream_options: { include_usage: true },
      });
      let usage: WebLLM.CompletionUsage | null = null;
      let aborted = false;
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) onToken(delta);
        if (chunk.choices[0]?.finish_reason === 'abort') aborted = true;
        if (chunk.usage) usage = chunk.usage;
      }
      const tps = usage?.extra?.decode_tokens_per_s ? Math.round(usage.extra.decode_tokens_per_s * 10) / 10 : null;
      this.stats = { ...this.stats, tokensPerSecond: tps };
      this.set('ready');
      return { tps: aborted ? null : tps, aborted };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('abort')) {
        this.set('ready');
        return { tps: null, aborted: true };
      }
      this.error = message;
      this.set('error');
      return { tps: null, aborted: false };
    }
  }

  interrupt() {
    this.engine?.interruptGenerate();
  }

  async resetChat() {
    await this.engine?.resetChat();
  }
}

export const sharedEngine = new SharedEngine();
