import type { AgentRobotAvatar } from 'agent-robot-avatar';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'agent-robot-avatar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          size?: number | string;
          color?: string;
          motion?: 'auto' | 'reduce' | 'full';
          'auto-sleep'?: number | string;
          'wake-on'?: 'activity' | 'interaction' | 'manual';
          ref?: React.Ref<AgentRobotAvatar>;
        };
      }
    }
  }
}

export {};
