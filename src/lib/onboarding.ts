export type UseCase = 'writing' | 'coding' | 'research' | 'chat' | 'learning';
export type Experience = 'beginner' | 'intermediate' | 'expert';
export type ResponseStyle = 'concise' | 'balanced' | 'detailed';

export interface OnboardingPrefs {
  useCase: UseCase | null;
  experience: Experience | null;
  responseStyle: ResponseStyle | null;
  completedAt: number | null;
}

const STORAGE_KEY = 'lmp:onboarding';

export const DEFAULT_PREFS: OnboardingPrefs = {
  useCase: null,
  experience: null,
  responseStyle: null,
  completedAt: null,
};

export function loadPrefs(): OnboardingPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<OnboardingPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: OnboardingPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable — prefs stay in memory only */
  }
}

export function clearPrefs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildSystemPrompt(prefs: OnboardingPrefs): string {
  const parts: string[] = ['You are a helpful, private AI assistant running entirely on the user\'s device.'];
  if (prefs.useCase === 'writing') parts.push('The user mainly wants help with writing: focus on clarity, tone, and structure.');
  else if (prefs.useCase === 'coding') parts.push('The user mainly wants coding help: provide accurate, working code with brief explanations.');
  else if (prefs.useCase === 'research') parts.push('The user mainly wants research help: be precise, cite reasoning steps, and distinguish facts from inference.');
  else if (prefs.useCase === 'learning') parts.push('The user mainly wants to learn: explain step by step with friendly examples.');
  else if (prefs.useCase === 'chat') parts.push('The user wants general conversation: be warm and engaging.');

  if (prefs.experience === 'beginner') parts.push('Avoid jargon; explain any technical terms simply.');
  else if (prefs.experience === 'expert') parts.push('Assume strong domain knowledge; skip basic explanations.');

  if (prefs.responseStyle === 'concise') parts.push('Keep answers short and to the point.');
  else if (prefs.responseStyle === 'detailed') parts.push('Give thorough, well-structured answers with examples.');
  return parts.join(' ');
}
