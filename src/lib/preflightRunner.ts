import type * as WebLLM from '@mlc-ai/web-llm';
import { PREFLIGHT_LADDER, type ResolvedModel } from './preflight';

const INFERENCE_PROMPT = 'Hi';
const INFERENCE_TIMEOUT_MS = 120_000;

export class PreflightCancelled extends Error {
  constructor() {
    super('Check cancelled');
    this.name = 'PreflightCancelled';
  }
}

function loadWebLLM() {
  return import('@mlc-ai/web-llm');
}

/** Map the ladder onto ids this engine version actually ships, picking f32 builds when the GPU lacks 16-bit shaders. */
export async function resolveLadder(shaderF16: boolean): Promise<ResolvedModel[]> {
  const { prebuiltAppConfig } = await loadWebLLM();
  const records = new Map(prebuiltAppConfig.model_list.map((r) => [r.model_id, r]));
  return PREFLIGHT_LADDER.map((m) => {
    const id = `${m.baseId}-${shaderF16 ? 'q4f16_1' : 'q4f32_1'}-MLC`;
    const record = records.get(id);
    return { ...m, id, vramMb: record?.vram_required_MB ?? null, available: Boolean(record) };
  });
}

export async function findCachedModels(models: ResolvedModel[]): Promise<Set<string>> {
  const { hasModelInCache } = await loadWebLLM();
  const cached = new Set<string>();
  await Promise.all(
    models
      .filter((m) => m.available)
      .map(async (m) => {
        try {
          if (await hasModelInCache(m.id)) cached.add(m.id);
        } catch {
          /* treat as not cached */
        }
      })
  );
  return cached;
}

export interface ModelTestResult {
  engine: WebLLM.MLCEngine;
  loadMs: number;
  inferenceMs: number;
  tokensPerSecond: number | null;
  reply: string;
}

/**
 * Load one model and ask it a one-word prompt. On any failure the engine is
 * unloaded before rethrowing so the next, larger attempt starts with free GPU memory.
 */
export async function testModel(
  modelId: string,
  opts: {
    signal: AbortSignal;
    onLoadProgress: (percent: number, text: string) => void;
    onStage: (stage: 'download' | 'inference') => void;
  }
): Promise<ModelTestResult> {
  const { MLCEngine } = await loadWebLLM();
  if (opts.signal.aborted) throw new PreflightCancelled();

  const engine = new MLCEngine({
    initProgressCallback: (r) => opts.onLoadProgress(Math.min(100, Math.round(r.progress * 100)), r.text),
  });
  const onAbort = () => {
    engine.interruptGenerate();
    void engine.unload().catch(() => undefined);
  };
  opts.signal.addEventListener('abort', onAbort, { once: true });

  try {
    opts.onStage('download');
    const loadStart = performance.now();
    await engine.reload(modelId);
    const loadMs = Math.round(performance.now() - loadStart);
    if (opts.signal.aborted) throw new PreflightCancelled();

    opts.onStage('inference');
    const inferStart = performance.now();
    let timer: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => {
        engine.interruptGenerate();
        reject(new Error(`No reply within ${INFERENCE_TIMEOUT_MS / 1000}s — the model is too slow on this device.`));
      }, INFERENCE_TIMEOUT_MS);
    });
    const response = await Promise.race([
      engine.chat.completions.create({
        messages: [{ role: 'user', content: INFERENCE_PROMPT }],
        max_tokens: 16,
        temperature: 0,
        stream: false,
      }),
      timeout,
    ]).finally(() => window.clearTimeout(timer));
    if (opts.signal.aborted) throw new PreflightCancelled();

    const reply = response.choices[0]?.message?.content?.trim() ?? '';
    if (!reply) throw new Error('The model loaded but returned an empty reply.');
    const tps = response.usage?.extra?.decode_tokens_per_s;
    return {
      engine,
      loadMs,
      inferenceMs: Math.round(performance.now() - inferStart),
      tokensPerSecond: typeof tps === 'number' && Number.isFinite(tps) ? Math.round(tps * 10) / 10 : null,
      reply,
    };
  } catch (err) {
    await engine.unload().catch(() => undefined);
    if (opts.signal.aborted) throw new PreflightCancelled();
    throw err;
  } finally {
    opts.signal.removeEventListener('abort', onAbort);
  }
}
