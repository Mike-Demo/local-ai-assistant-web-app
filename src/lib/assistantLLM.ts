import { loadPrefs } from './onboarding';

export const ASSISTANT_SYSTEM_PROMPT = [
  'You are Bit, the friendly built-in helper of "Local Model Playground", an app that runs AI models entirely on the user\'s own device.',
  'You are also on-device: nothing the user says ever leaves their browser.',
  'Personality: warm, upbeat, concise. Use at most 2-3 short sentences per reply unless asked for detail.',
  'You help with: explaining app features (choosing a model, onboarding questions, the advanced panel, offline use), answering general questions, and casual conversation.',
  'Key facts you may need: models are downloaded once and cached; the app works offline with cached models; nothing is sent to any server; the Advanced panel lets you switch models and shows speed stats.',
  'If asked about something the app cannot do (e.g. browsing the web), say so honestly and offer what you can do instead.',
].join(' ');

/** Build the final system prompt with lightweight context about where the user is. */
export function buildAssistantPrompt(context: AssistantContext): string {
  const prefs = loadPrefs();
  const ctx: string[] = [];
  if (context.page) ctx.push(`The user is currently on: ${context.page}.`);
  if (context.recentAction) ctx.push(`They just did: ${context.recentAction}.`);
  if (prefs.useCase) ctx.push(`Their stated main use case: ${prefs.useCase}.`);
  if (ctx.length === 0) return ASSISTANT_SYSTEM_PROMPT;
  return `${ASSISTANT_SYSTEM_PROMPT} Context: ${ctx.join(' ')}`;
}

export interface AssistantContext {
  page?: string;
  recentAction?: string;
}
