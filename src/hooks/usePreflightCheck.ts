import { useCallback, useEffect, useRef, useState } from 'react';
import type * as WebLLM from '@mlc-ai/web-llm';
import { categorizeError, type ErrorCategory } from '@/lib/errorHandling';
import { sharedEngine } from '@/lib/sharedEngine';
import {
  MAX_CONSECUTIVE_FAILURES,
  deviceChecks,
  planModelChecks,
  plannedDownloadGb,
  readMemoryInfo,
  saveOutcome,
  scanDevice,
  type CheckResult,
  type DeviceReport,
  type LogLevel,
  type PreflightLogEntry,
  type PreflightOutcome,
} from '@/lib/preflight';
import { PreflightCancelled, findCachedModels, resolveLadder, testModel } from '@/lib/preflightRunner';

export type PreflightPhase = 'idle' | 'scanning' | 'confirm' | 'running' | 'done';

const FAILURE_REASONS: Record<ErrorCategory, string> = {
  oom: 'Ran out of memory while loading.',
  network: 'The download was interrupted.',
  gpu: "The graphics processor couldn't run it.",
  unknown: 'It failed to load or reply.',
};

function describeFailure(err: unknown): string {
  const category = categorizeError(err);
  if (category !== 'unknown') return FAILURE_REASONS[category];
  const message = err instanceof Error ? err.message : String(err);
  return message.length > 140 ? `${message.slice(0, 140)}…` : message || FAILURE_REASONS.unknown;
}

export interface PreflightState {
  phase: PreflightPhase;
  checks: CheckResult[];
  report: DeviceReport | null;
  log: PreflightLogEntry[];
  best: PreflightOutcome | null;
  downloadGb: number;
  testableCount: number;
  overallPercent: number;
  stopped: boolean;
  announcement: string;
}

const INITIAL: PreflightState = {
  phase: 'idle',
  checks: [],
  report: null,
  log: [],
  best: null,
  downloadGb: 0,
  testableCount: 0,
  overallPercent: 0,
  stopped: false,
  announcement: '',
};

export function usePreflightCheck() {
  const [state, setState] = useState<PreflightState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const heldEngineRef = useRef<{ engine: WebLLM.MLCEngine; modelId: string } | null>(null);
  const logIdRef = useRef(0);
  const scanTokenRef = useRef(0);

  const log = useCallback(async (level: LogLevel, event: string, model: string | null, error: unknown = null) => {
    const entry: PreflightLogEntry = {
      id: ++logIdRef.current,
      level,
      event,
      model,
      error: error === null ? null : error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      memoryInfo: await readMemoryInfo(),
      timestamp: new Date().toISOString(),
    };
    if (level === 'error') console.error('[preflight]', { model, error: entry.error, memoryInfo: entry.memoryInfo, timestamp: entry.timestamp });
    else if (level === 'warn') console.warn('[preflight]', event, entry);
    else console.info('[preflight]', event);
    setState((s) => ({ ...s, log: [...s.log, entry] }));
  }, []);

  const patchCheck = useCallback((key: string, patch: Partial<CheckResult>) => {
    setState((s) => ({ ...s, checks: s.checks.map((c) => (c.key === key ? { ...c, ...patch } : c)) }));
  }, []);

  const releaseHeld = useCallback(async () => {
    const held = heldEngineRef.current;
    heldEngineRef.current = null;
    await held?.engine.unload().catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      void heldEngineRef.current?.engine.unload().catch(() => undefined);
      heldEngineRef.current = null;
    },
    []
  );

  /** Fast, download-free checks; ends at the confirm step (or done if nothing can run). */
  const prepare = useCallback(async () => {
    abortRef.current?.abort();
    await releaseHeld();
    const token = ++scanTokenRef.current;
    logIdRef.current = 0;
    setState({ ...INITIAL, phase: 'scanning', announcement: 'Checking your device…' });

    const report = await scanDevice();
    if (token !== scanTokenRef.current) return;
    const base = deviceChecks(report);
    let modelChecks: CheckResult[] = [];
    if (report.webgpu.ok) {
      try {
        const ladder = await resolveLadder(report.webgpu.shaderF16);
        const cached = await findCachedModels(ladder);
        modelChecks = planModelChecks(report, ladder, cached);
      } catch (err) {
        await log('error', 'Could not load the AI engine', null, err);
      }
    }
    if (token !== scanTokenRef.current) return;

    const checks = [...base, ...modelChecks];
    const testableCount = modelChecks.filter((c) => c.status === 'pending').length;
    const blocked = base.some((c) => c.status === 'failed') || testableCount === 0;
    await log('info', `Device scan: WebGPU ${report.webgpu.ok ? 'available' : 'unavailable'}, ${report.cores ?? '?'} cores, ${report.memory.deviceMemoryGb ?? '?'} GB memory`, null);
    for (const c of base.filter((x) => x.status !== 'passed')) await log(c.status === 'failed' ? 'error' : 'warn', `${c.label}: ${c.reason}`, null);

    setState((s) => ({
      ...s,
      phase: blocked ? 'done' : 'confirm',
      report,
      checks,
      testableCount,
      downloadGb: plannedDownloadGb(checks),
      announcement: blocked ? 'Device check finished. No model can run here.' : 'Device scan complete. Ready to test models.',
    }));
  }, [log, releaseHeld]);

  const run = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    const queue = state.checks.filter((c) => c.kind === 'model' && c.status === 'pending');
    setState((s) => ({ ...s, phase: 'running', stopped: false, announcement: 'Testing models, smallest first.' }));
    await sharedEngine.release();

    let best: PreflightOutcome | null = null;
    let consecutiveFails = 0;
    let finished = 0;

    for (const check of queue) {
      const model = check.model;
      if (!model) continue;
      if (signal.aborted) {
        patchCheck(check.key, { status: 'skipped', reason: 'Not attempted — check stopped.' });
        continue;
      }
      if (consecutiveFails >= MAX_CONSECUTIVE_FAILURES) {
        patchCheck(check.key, { status: 'skipped', reason: 'Not attempted — the two models before it failed.' });
        continue;
      }

      // Free the previous winner's memory so it can't cause a false failure on the bigger model.
      await releaseHeld();
      const started = performance.now();
      patchCheck(check.key, { status: 'running', stage: 'download', progress: 0 });
      setState((s) => ({ ...s, announcement: `Testing ${model.name}.` }));
      await log('info', `Testing ${model.name}`, model.id);

      let lastPercent = -1;
      try {
        const result = await testModel(model.id, {
          signal,
          onStage: (stage) => patchCheck(check.key, { stage }),
          onLoadProgress: (percent) => {
            if (percent === lastPercent) return;
            lastPercent = percent;
            patchCheck(check.key, { progress: percent });
            setState((s) => ({
              ...s,
              overallPercent: Math.round(((finished + percent / 100) / Math.max(queue.length, 1)) * 100),
            }));
          },
        });
        heldEngineRef.current = { engine: result.engine, modelId: model.id };
        consecutiveFails = 0;
        best = {
          modelId: model.id,
          modelName: model.name,
          sizeGb: model.sizeGb,
          tokensPerSecond: result.tokensPerSecond,
          testedAt: new Date().toISOString(),
        };
        patchCheck(check.key, {
          status: 'passed',
          stage: null,
          progress: null,
          durationMs: Math.round(performance.now() - started),
          tokensPerSecond: result.tokensPerSecond,
          reason: null,
        });
        setState((s) => ({ ...s, best, announcement: `${model.name} passed.` }));
        await log('info', `${model.name} passed (load ${result.loadMs} ms, reply ${result.inferenceMs} ms, ${result.tokensPerSecond ?? '?'} tok/s)`, model.id);
      } catch (err) {
        if (err instanceof PreflightCancelled) {
          patchCheck(check.key, { status: 'skipped', stage: null, progress: null, reason: 'Stopped before it finished.' });
          await log('warn', `Stopped during ${model.name}`, model.id);
          continue;
        }
        consecutiveFails += 1;
        patchCheck(check.key, {
          status: 'failed',
          stage: null,
          progress: null,
          durationMs: Math.round(performance.now() - started),
          reason: describeFailure(err),
        });
        setState((s) => ({ ...s, announcement: `${model.name} failed. Continuing.` }));
        await log('error', `${model.name} failed`, model.id, err);
      }
      finished += 1;
      setState((s) => ({ ...s, overallPercent: Math.round((finished / Math.max(queue.length, 1)) * 100) }));
    }

    // A stopped run with no winner shouldn't erase an earlier good result.
    if (best || !signal.aborted) saveOutcome(best);
    abortRef.current = null;
    setState((s) => ({
      ...s,
      phase: 'done',
      best,
      overallPercent: 100,
      stopped: signal.aborted,
      announcement: best ? `Check complete. Best model: ${best.modelName}.` : 'Check complete. No model passed.',
    }));
  }, [state.checks, log, patchCheck, releaseHeld]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Hand the winning model to the app. Returns true if it was already loaded, false if the caller must load it. */
  const proceed = useCallback(async (): Promise<boolean> => {
    const held = heldEngineRef.current;
    const best = state.best;
    if (!best) return false;
    if (held && held.modelId === best.modelId) {
      heldEngineRef.current = null;
      await sharedEngine.adopt(held.engine, held.modelId, best.tokensPerSecond);
      return true;
    }
    await releaseHeld();
    return false;
  }, [state.best, releaseHeld]);

  const discard = useCallback(async () => {
    abortRef.current?.abort();
    await releaseHeld();
  }, [releaseHeld]);

  return { ...state, prepare, run, stop, proceed, discard };
}
