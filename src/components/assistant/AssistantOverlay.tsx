import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAssistantState } from './assistantContext';
import { AssistantAvatar } from './AssistantAvatar';
import { AssistantChat } from './AssistantChat';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AssistantOverlay() {
  const { state, open, unreadHint, openAssistant, closeAssistant } = useAssistantState();
  const [pos, setPos] = useState<{ bottom: number; right: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startBottom: number; startRight: number } | null>(null);
  const draggedRef = useRef(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (state === 'hidden' && !unreadHint) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startBottom: pos?.bottom ?? 16, startRight: pos?.right ?? 16 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) {
      draggedRef.current = true;
      setPos({
        bottom: Math.min(Math.max(d.startBottom - dy, 8), window.innerHeight - 80),
        right: Math.min(Math.max(d.startRight - dx, 8), window.innerWidth - 80),
      });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Fires for mouse, touch and keyboard (Enter/Space); ignored right after a drag.
  const onLauncherClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    openAssistant();
  };

  const style = pos ? { bottom: pos.bottom, right: pos.right } : { bottom: 16, right: 16 };

  return (
    <div className="fixed z-40 select-none" style={style} data-testid="assistant-overlay">
      {unreadHint && !open && (
        <div
          role="status"
          className="glass-card animate-slide-up absolute bottom-full right-0 mb-2 w-56 rounded-2xl p-3 text-xs leading-relaxed"
        >
          {unreadHint}
          <button
            onClick={openAssistant}
            className="mt-2 block text-xs font-semibold text-[#6a4f94] hover:underline dark:text-[#c4b1e0]"
          >
            Chat with Bit →
          </button>
        </div>
      )}

      {open ? (
        <div
          ref={dialogRef}
          className="glass-card animate-slide-up flex h-[28rem] w-[21rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl shadow-2xl"
          role="dialog"
          aria-label="Assistant chat"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closeAssistant();
            }
          }}
        >
          <div className="flex items-center justify-between px-3 pt-2.5">
            <div className="flex items-center gap-2">
              <AssistantAvatar state={state} size={40} />
              <div>
                <p className="text-sm font-bold leading-tight">Bit</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {state === 'thinking' ? 'Thinking…' : state === 'speaking' ? 'Speaking…' : 'On-device & private'}
                </p>
              </div>
            </div>
            <button
              onClick={closeAssistant}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <AssistantChat />
          </div>
        </div>
      ) : (
        <button
          ref={launcherRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onLauncherClick}
          aria-label="Open assistant (Ctrl+/)"
          className="block cursor-grab touch-none rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4A90D9]/60 active:cursor-grabbing"
        >
          <AssistantAvatar state={state} size={REDUCED_MOTION ? 56 : 64} decorative />
          {unreadHint && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-[#00B4D8]" aria-hidden />}
        </button>
      )}
    </div>
  );
}
