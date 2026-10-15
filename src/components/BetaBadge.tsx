import { FlaskConical } from 'lucide-react';

export function BetaBadge({ withIcon = false }: { withIcon?: boolean }) {
  return (
    <span
      title="This app is in beta testing"
      className="inline-flex items-center gap-1 rounded-full border border-sky-600/30 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/60 dark:text-sky-200"
    >
      {withIcon && <FlaskConical className="h-3 w-3" aria-hidden />}
      Beta
    </span>
  );
}
