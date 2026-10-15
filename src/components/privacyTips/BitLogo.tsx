import { Settings } from 'lucide-react';
import { AssistantAvatar } from '@/components/assistant/AssistantAvatar';
import { BetaBadge } from '@/components/BetaBadge';
import { usePrivacyTips } from './privacyTipsContext';
import { TipBubble } from './TipBubble';

const APP_NAME = 'LocalModel Hub';

/** Bit as the app logo: idles while quiet, bounces and glows while sharing a tip, click for a tip. */
export function BitLogo({ showName = true, size = 40 }: { showName?: boolean; size?: number }) {
  const { currentTip, closing, showTip, dismissTip, openSettings } = usePrivacyTips();
  const talking = Boolean(currentTip) && !closing;

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={talking ? dismissTip : showTip}
        aria-label={talking ? 'Bit, privacy tip showing. Hide tip' : 'Bit, your privacy buddy. Show a privacy tip'}
        aria-expanded={talking}
        className="group flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition hover:bg-neutral-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:hover:bg-white/5"
      >
        <span
          className={`relative inline-flex shrink-0 ${talking ? 'animate-bit-talk' : 'animate-bit-idle'}`}
          style={{ width: size, height: size }}
        >
          <AssistantAvatar state="idle" size={size} decorative talking={talking} />
          {talking && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#00B4D8] ring-2 ring-white dark:ring-neutral-950" aria-hidden />}
        </span>
        {showName && (
          <span className="text-sm font-bold tracking-tight text-neutral-900 transition group-hover:text-[#245a96] dark:text-neutral-100 dark:group-hover:text-sky-200">
            {APP_NAME}
          </span>
        )}
      </button>
      <BetaBadge />
      <button
        type="button"
        onClick={openSettings}
        aria-label="Privacy tip settings"
        className="rounded-full p-1.5 text-neutral-600 transition hover:bg-neutral-900/5 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100"
      >
        <Settings className="h-4 w-4" aria-hidden />
      </button>
      <TipBubble />
    </div>
  );
}
