import { createContext, useContext } from 'react';

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'reacting' | 'hidden';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantContextValue {
  state: AssistantState;
  open: boolean;
  busy: boolean;
  voiceEnabled: boolean;
  voiceInputConsent: boolean;
  welcomed: boolean;
  unreadHint: string | null;
  ttsSupported: boolean;
  sttSupported: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  /** Send a user message; resolves with the assistant's full reply (or null). */
  send: (text: string) => Promise<string | null>;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceInputConsent: (v: boolean) => void;
  reportListening: (v: boolean) => void;
  reportSpeaking: (v: boolean) => void;
  suggest: (text: string) => void;
  dismissHint: () => void;
  setContext: (ctx: { page?: string; recentAction?: string }) => void;
  markWelcomed: () => void;
}

export const AssistantContext = createContext<AssistantContextValue | null>(null);
// Kept separate so streaming replies only re-render the chat panel, not every consumer.
export const AssistantMessagesContext = createContext<AssistantMessage[]>([]);

export function useAssistantState(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}

export function useAssistantMessages(): AssistantMessage[] {
  return useContext(AssistantMessagesContext);
}
