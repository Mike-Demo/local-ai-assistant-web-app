import type { ReactNode } from 'react';
import { BitLogo } from '@/components/privacyTips/BitLogo';

/** Slim top bar with the Bit logo, used on every screen except the chat (which has its own header). */
export function AppTopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200/60 bg-[#F5F5F7]/90 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/90 sm:px-6">
      <BitLogo />
      {children}
    </header>
  );
}
