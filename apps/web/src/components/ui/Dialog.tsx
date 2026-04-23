import { useEffect, useId, useRef, type ReactNode } from 'react';
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
}: DialogProps): React.ReactElement {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (event: Event): void => {
      event.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'rounded-lg p-0 border border-slate-200 shadow-lg backdrop:bg-slate-900/40',
        'w-full max-w-lg',
        className,
      )}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-1 text-sm text-slate-600">
            {description}
          </p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
