import { useEffect, useRef } from 'react';
import type { AgentRobotAvatar, AgentRobotAvatarAction } from 'agent-robot-avatar';
import type { AssistantState } from './assistantContext';

/**
 * Maps assistant state machine states to agent-robot-avatar actions.
 * The web component handles idle blink, pointer-follow and reduced motion
 * internally via its `motion` attribute, so we only drive semantic actions.
 */
const STATE_TO_ACTION: Record<Exclude<AssistantState, 'hidden'>, AgentRobotAvatarAction> = {
  idle: 'idle',
  listening: 'input',
  thinking: 'waiting',
  speaking: 'send',
  reacting: 'love',
};

const STATE_LABEL: Record<AssistantState, string> = {
  idle: 'ready',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'replying',
  reacting: 'happy',
  hidden: 'ready',
};

export function AssistantAvatar({
  state,
  size = 96,
  decorative = false,
  talking = false,
}: {
  state: AssistantState;
  size?: number;
  decorative?: boolean;
  talking?: boolean;
}) {
  const hostRef = useRef<AgentRobotAvatar | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Lazy-load the web component only when the assistant first appears.
      await import('agent-robot-avatar');
      const el = hostRef.current;
      if (cancelled || !el || state === 'hidden') return;
      el.setAntennaFlash(talking);
      void el.play(talking ? 'send' : (STATE_TO_ACTION[state] ?? 'idle'));
    })();
    return () => {
      cancelled = true;
    };
  }, [state, talking]);

  return (
    <agent-robot-avatar
      ref={hostRef}
      size={size}
      color="#7B5EA7"
      motion="auto"
      auto-sleep="0"
      wake-on="manual"
      className="drop-shadow-lg"
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': `Bit, your assistant — ${STATE_LABEL[state]}` })}
    />
  );
}
