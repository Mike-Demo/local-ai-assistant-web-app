import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, MessageSquare, PenLine, BookOpen, GraduationCap, Code2 } from 'lucide-react';
import type { Experience, ResponseStyle, UseCase } from '../lib/onboarding';
import type { OnboardingPrefs } from '../lib/onboarding';
import { usePauseTips } from '@/components/privacyTips/privacyTipsContext';

const USE_CASES: { id: UseCase; label: string; desc: string; icon: typeof PenLine }[] = [
  { id: 'writing', label: 'Writing', desc: 'Emails, essays, and edits', icon: PenLine },
  { id: 'coding', label: 'Coding', desc: 'Debug, explain, and write code', icon: Code2 },
  { id: 'research', label: 'Research', desc: 'Summarize and dig into topics', icon: BookOpen },
  { id: 'chat', label: 'General Chat', desc: 'Everyday questions and ideas', icon: MessageSquare },
  { id: 'learning', label: 'Learning', desc: 'Tutoring and explanations', icon: GraduationCap },
];

const EXPERIENCE: { id: Experience; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Explain things simply' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Some familiarity with AI' },
  { id: 'expert', label: 'Expert', desc: 'Skip the basics' },
];

const STYLES: { id: ResponseStyle; label: string; desc: string }[] = [
  { id: 'concise', label: 'Concise', desc: 'Short, straight to the point' },
  { id: 'balanced', label: 'Balanced', desc: 'A friendly middle ground' },
  { id: 'detailed', label: 'Detailed', desc: 'Thorough with examples' },
];

interface Question {
  key: keyof Omit<OnboardingPrefs, 'completedAt'>;
  title: string;
  subtitle: string;
}

const QUESTIONS: Question[] = [
  { key: 'useCase', title: 'What will you mainly use this for?', subtitle: 'This tunes how the AI talks with you — change any time.' },
  { key: 'experience', title: 'How would you describe your experience with AI?', subtitle: 'You can skip this — it only affects explanations.' },
  { key: 'responseStyle', title: 'Choose your preferred response style', subtitle: 'How long should answers be?' },
];

export default function Onboarding({
  onComplete,
  onBack,
}: {
  onComplete: (prefs: Omit<OnboardingPrefs, 'completedAt'>) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ useCase: null, experience: null, responseStyle: null } as Omit<OnboardingPrefs, 'completedAt'>);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  usePauseTips(true);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const question = QUESTIONS[step];
  const current = answers[question.key];
  const progressPercent = ((step + (current ? 1 : 0)) / QUESTIONS.length) * 100;

  const choose = (value: string) => {
    const next = { ...answers, [question.key]: value } as Omit<OnboardingPrefs, 'completedAt'>;
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(next);
    }
  };

  const skip = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else onComplete(answers);
  };

  const options =
    question.key === 'useCase'
      ? USE_CASES.map((u) => ({ id: u.id, label: u.label, desc: u.desc, icon: u.icon }))
      : question.key === 'experience'
        ? EXPERIENCE.map((e, i) => ({ id: e.id, label: e.label, desc: e.desc, icon: [null, null, null][i] ?? undefined }))
        : STYLES.map((s, i) => ({ id: s.id, label: s.label, desc: s.desc, icon: [null, null, null][i] ?? undefined }));

  const onRadioKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const idx = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const last = radios.length - 1;
    const nextIdx =
      e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (idx === last ? 0 : idx + 1)
      : idx === 0 ? last : idx - 1;
    radios.forEach((r, i) => (r.tabIndex = i === nextIdx ? 0 : -1));
    radios[nextIdx].focus();
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 animate-float rounded-full bg-[#7B5EA7]/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 animate-float-delayed rounded-full bg-[#00B4D8]/20 blur-3xl" aria-hidden />

      <div className="relative z-10 w-full max-w-xl">
        <button onClick={step === 0 ? onBack : () => setStep(step - 1)} className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-neutral-600 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {step === 0 ? 'Back' : 'Previous question'}
        </button>

        <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <span>Step {step + 1} of {QUESTIONS.length}</span>
          <button onClick={skip} className="text-neutral-600 underline-offset-2 transition hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200">
            Skip
          </button>
        </div>
        <div className="progress-track mb-8" role="progressbar" aria-label="Setup progress" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${Math.max(progressPercent, 6)}%` }} />
        </div>

        <h2 ref={headingRef} tabIndex={-1} className="animate-slide-up text-2xl font-bold tracking-tight outline-none focus:outline-none sm:text-3xl">{question.title}</h2>
        <p className="animate-slide-up mt-2 text-sm text-neutral-500 dark:text-neutral-400" style={{ animationDelay: '60ms' }}>
          {question.subtitle}
        </p>

        <div
          key={question.key}
          role="radiogroup"
          aria-label={question.title}
          onKeyDown={onRadioKeyDown}
          className={`mt-7 grid gap-3 ${question.key === 'useCase' ? 'sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
        >
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const selected = current === opt.id;
            const tabbable = current ? selected : i === 0;
            return (
              <button
                key={opt.id}
                onClick={() => choose(opt.id)}
                role="radio"
                aria-checked={selected}
                tabIndex={tabbable ? 0 : -1}
                className={`group relative flex min-h-[76px] animate-slide-up items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.015] hover:shadow-md active:scale-[0.99] ${
                  selected
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-neutral-200 bg-white/70 hover:border-[#4A90D9]/40 dark:border-neutral-700 dark:bg-white/5'
                }`}
                style={{
                  animationDelay: `${i * 50}ms`,
                  ...(selected
                    ? { backgroundImage: 'linear-gradient(120deg, #6a4f94, #2f6fb5 60%, #0a7f9a)' }
                    : {}),
                }}
              >
                {Icon && (
                  <Icon className={`h-6 w-6 shrink-0 ${selected ? 'text-white' : 'text-[#7B5EA7] dark:text-[#b9a3d8]'}`} aria-hidden />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className={`mt-0.5 block text-xs ${selected ? 'text-white/90' : 'text-neutral-600 dark:text-neutral-400'}`}>{opt.desc}</span>
                </span>
                {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-white" aria-hidden />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={skip}
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 transition hover:text-[#6a4f94] dark:text-neutral-400 dark:hover:text-[#c4b1e0]"
          >
            {step < QUESTIONS.length - 1 ? 'Skip this question' : 'Finish without answering'}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
