import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppTopBar } from '@/components/AppTopBar';
import { MODELS } from '../data/models';
import { loadPrefs, savePrefs, type OnboardingPrefs } from '../lib/onboarding';
import { useLLMEngine } from '../lib/useLLMEngine';
import { detectCapability, recommendModel, type DeviceCapability } from '../lib/deviceCapability';
import { readInterruptedLoad } from '../lib/errorHandling';
import { ladderNameFor, loadOutcome, type PreflightOutcome } from '@/lib/preflight';
import { useAssistantState } from '../hooks/useAssistant';
import Landing from './Landing';
import Onboarding from './Onboarding';
import ModelLoading from './ModelLoading';
import Preflight from './Preflight';
import Chat, { AdvancedDrawer } from './Chat';

type Stage = 'landing' | 'onboarding' | 'preflight' | 'loading' | 'chat';

const DEFAULT_MODEL_ID = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';

/** Smaller-model fallback ladder: if a load fails, walk down this chain. */
const FALLBACK_LADDER: Record<string, string | undefined> = {
  'Phi-3-mini-4k-instruct-q4f16_1-MLC': 'phi-2-q4f16_1-MLC',
  'Phi-3.5-mini-instruct-q4f16_1-MLC': 'phi-2-q4f16_1-MLC',
  'phi-2-q4f16_1-MLC': undefined,
};

export default function Home() {
  const [stage, setStage] = useState<Stage>('landing');
  const [prefs, setPrefs] = useState<OnboardingPrefs>(() => loadPrefs());
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [capability, setCapability] = useState<DeviceCapability | null>(null);
  const [preflightResult, setPreflightResult] = useState<PreflightOutcome | null>(() => loadOutcome());
  const engine = useLLMEngine();
  const assistant = useAssistantState();

  // Detect device once. Priority for the pre-selected model: an interrupted
  // download, then this device's tested result, then the spec-based guess.
  useEffect(() => {
    void detectCapability().then((cap) => {
      setCapability(cap);
      const rec = recommendModel(cap, MODELS);
      const tested = loadOutcome();
      if (tested) setModelId(tested.modelId);
      else if (rec?.webllm.id) setModelId(rec.webllm.id);
      const interrupted = readInterruptedLoad();
      if (interrupted) setModelId(interrupted.modelId);
    });
  }, []);

  const webllmModels = useMemo(() => MODELS.filter((m) => m.webllm.supported), []);
  const selectedModel = webllmModels.find((m) => m.webllm.id === modelId) ?? webllmModels[0];
  const nameFor = (id: string) => webllmModels.find((m) => m.webllm.id === id)?.name ?? ladderNameFor(id) ?? id;
  const activeModelName = engine.stats.activeModelId
    ? nameFor(engine.stats.activeModelId)
    : modelId
      ? nameFor(modelId)
      : selectedModel?.name ?? 'model';

  const openPreflight = () => {
    if (capability?.detected && !capability.webgpu) return;
    assistant.setContext({ page: 'preflight', recentAction: 'started a device check to find the best model' });
    setStage('preflight');
  };

  const finishPreflight = (outcome: PreflightOutcome, alreadyLoaded: boolean) => {
    setPreflightResult(outcome);
    setModelId(outcome.modelId);
    if (alreadyLoaded) setStage('chat');
    else beginLoad(outcome.modelId);
  };

  const getStarted = () => {
    if (capability?.detected && !capability.webgpu) return;
    assistant.setContext({ page: 'loading', recentAction: 'chose a model to download' });
    if (prefs.completedAt) beginLoad();
    else setStage('onboarding');
  };

  const beginLoad = (id: string = modelId) => {
    if (!id) return;
    setStage('loading');
    void engine.loadModel(id).then((ok) => {
      if (ok) {
        setStage('chat');
        return;
      }
      // Auto-downgrade: on failure, walk the ladder to a smaller model.
      const smaller = FALLBACK_LADDER[id];
      if (smaller && webllmModels.some((m) => m.webllm.id === smaller)) {
        assistant.suggest(`That model didn't load on this device, so I'm trying a smaller one for you.`);
        setModelId(smaller);
        void engine.loadModel(smaller).then((ok2) => {
          if (ok2) setStage('chat');
        });
      } else {
        assistant.suggest(`The model couldn't load on this device. From the error screen you can retry, or head back to settings to pick a lighter model.`);
      }
      // Bottom of the ladder: stay on the loading screen's error panel,
      // which offers Retry and links back to Advanced Settings.
    });
  };

  const completeOnboarding = (answers: Omit<OnboardingPrefs, 'completedAt'>) => {
    const next: OnboardingPrefs = { ...answers, completedAt: Date.now() };
    setPrefs(next);
    savePrefs(next);
    beginLoad();
  };

  let page: ReactNode;
  switch (stage) {
    case 'onboarding':
      page = <Onboarding onComplete={completeOnboarding} onBack={() => setStage('landing')} />;
      break;
    case 'preflight':
      page = (
        <Preflight
          onProceed={finishPreflight}
          onExit={() => {
            const saved = loadOutcome();
            setPreflightResult(saved);
            if (saved) setModelId(saved.modelId);
            setStage('landing');
          }}
        />
      );
      break;
    case 'loading':
      page = (
        <ModelLoading
          progress={engine.progress}
          modelName={activeModelName}
          error={engine.status === 'error' ? { category: engine.errorCategory, message: engine.error } : null}
          onRetry={() => beginLoad(engine.stats.activeModelId ?? modelId)}
          onTrySmaller={(() => {
            const smaller = FALLBACK_LADDER[engine.stats.activeModelId ?? modelId];
            return smaller ? () => beginLoad(smaller) : undefined;
          })()}
          onBackToSettings={() => setStage('landing')}
          hasSmaller={Boolean(FALLBACK_LADDER[engine.stats.activeModelId ?? modelId])}
        />
      );
      break;
    case 'chat':
      return (
        <>
          <Chat modelName={activeModelName} onOpenAdvanced={() => setAdvancedOpen(true)} />
          <ChatReadyHint assistant={assistant} />
          <AdvancedDrawer
            open={advancedOpen}
            onClose={() => setAdvancedOpen(false)}
            stats={engine.stats}
            status={engine.status}
            models={MODELS}
            currentModelId={engine.stats.activeModelId}
            onSwitchModel={(id) => {
              setAdvancedOpen(false);
              setModelId(id);
              beginLoad(id);
            }}
          />
        </>
      );
    default:
      page = (
        <Landing
          models={MODELS}
          capability={capability}
          selectedModelId={modelId}
          onSelectModel={setModelId}
          onGetStarted={getStarted}
          onRunPreflight={openPreflight}
          preflightResult={preflightResult}
        />
      );
  }

  return (
    <div className="flex h-full flex-col">
      <AppTopBar />
      <div className="min-h-0 flex-1 overflow-y-auto">{page}</div>
    </div>
  );
}

/** One-time welcome hint once the model is ready for the first time. */
function ChatReadyHint({ assistant }: { assistant: ReturnType<typeof useAssistantState> }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    assistant.setContext({ page: 'chat', recentAction: 'finished loading a model' });
    if (!assistant.welcomed) {
      assistant.suggest('Your AI is ready! I\'m Bit — tap me any time for tips or to ask questions.');
      assistant.markWelcomed();
    }
  }, [assistant]);
  return null;
}
