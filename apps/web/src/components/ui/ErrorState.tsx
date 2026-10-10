import React from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string | string[];
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps): React.ReactElement {
  const formattedMessage = Array.isArray(message) ? message.join('; ') : message;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-500/30 bg-red-950/25 p-6 text-center shadow-dark-sm ${className}`}
    >
      <div className="mx-auto max-w-md space-y-2">
        <h3 className="text-sm font-semibold text-red-400">{title}</h3>
        <p className="text-sm text-slate-300">{formattedMessage}</p>
        {onRetry ? (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
