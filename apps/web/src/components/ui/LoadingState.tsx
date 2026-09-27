import React from 'react';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = 'Loading data...',
  className = '',
}: LoadingStateProps): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`grid place-items-center py-12 text-slate-500 ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
