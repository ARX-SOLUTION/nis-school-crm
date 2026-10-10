import React, { useId, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MethodologyNoteProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function MethodologyNote({
  title = 'Hisoblash metodikasi va mezonlar',
  children,
  defaultOpen = false,
  className,
}: MethodologyNoteProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-muted-surface/60 transition-colors',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-neutral-600 hover:text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-colors min-h-[44px]"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
          <span>{title}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-neutral-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-secondary',
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="px-4 pb-3.5 pt-1 text-xs text-neutral-500 border-t border-border/40 space-y-1.5 animate-in fade-in duration-150"
        >
          {children}
        </div>
      )}
    </div>
  );
}
