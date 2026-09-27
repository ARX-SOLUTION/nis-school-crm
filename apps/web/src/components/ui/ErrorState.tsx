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
      className={`rounded-lg border border-red-200 bg-red-50/70 p-6 text-center ${className}`}
    >
      <div className="mx-auto max-w-md space-y-2">
        <h3 className="text-sm font-semibold text-red-900">{title}</h3>
        <p className="text-sm text-red-700">{formattedMessage}</p>
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
