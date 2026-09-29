import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={`rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="mx-auto max-w-sm space-y-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
