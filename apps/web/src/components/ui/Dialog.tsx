import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Minimal accessible dialog using the native <dialog> for focus trapping,
 * ESC handling, and backdrop. Each instance gets its own aria id pair via
 * useId(), so stacked dialogs don't collide on aria-labelledby.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps): React.ReactElement | null {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    if (!el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.open = true;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const onCancel = (event: Event): void => {
      event.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'rounded-xl p-0 border border-border bg-surface text-tertiary shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-xs',
        'w-[calc(100vw-1.5rem)] sm:w-full max-w-lg max-h-[calc(100dvh-2rem)] m-auto flex flex-col overflow-hidden',
        '[&:not([open])]:hidden',
        className,
      )}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-surface p-3.5 sm:p-5 pb-2.5 sm:pb-3">
        <div className="pr-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-tertiary">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-400 hover:text-tertiary hover:bg-muted-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] transition-colors shrink-0"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 pt-3 sm:pt-4">{children}</div>
    </dialog>
  );
}
