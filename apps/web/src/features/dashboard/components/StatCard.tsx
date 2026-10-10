import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'critical' | 'warning' | 'success';

export interface StatTrend {
  value: string | number;
  isPositive?: boolean;
  label: string;
}

export interface StatLink {
  href: string;
  text?: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  target?: string;
  trend?: StatTrend;
  link?: StatLink;
  hint?: string;
  tone?: StatTone;
  icon?: React.ReactNode;
  className?: string;
}

const toneStyles: Record<StatTone, { container: string; value: string }> = {
  default: {
    container: 'border-slate-800 ring-slate-800/80 bg-slate-900',
    value: 'text-slate-100',
  },
  critical: {
    container: 'border-slate-800 border-l-4 border-l-error ring-red-500/20 bg-red-950/20',
    value: 'text-error',
  },
  warning: {
    container: 'border-slate-800 border-l-4 border-l-amber-500 ring-amber-500/20 bg-amber-950/20',
    value: 'text-amber-400',
  },
  success: {
    container: 'border-slate-800 border-l-4 border-l-success ring-emerald-500/20 bg-emerald-950/20',
    value: 'text-success',
  },
};

export function StatCard({
  label,
  value,
  target,
  trend,
  link,
  hint,
  tone = 'default',
  icon,
  className,
}: StatCardProps): React.ReactElement {
  const currentTone = toneStyles[tone] || toneStyles.default;

  return (
    <div
      className={cn(
        'rounded-xl border ring-1 shadow-dark-sm p-5 space-y-2 flex flex-col justify-between transition-all duration-150 hover:border-slate-700',
        currentTone.container,
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          {icon ? <div className="text-slate-400 shrink-0">{icon}</div> : null}
        </div>

        <div
          className={cn(
            'text-2xl sm:text-3xl font-bold tracking-tight mt-1 tabular-nums',
            currentTone.value,
          )}
        >
          {value}
        </div>

        {target ? <div className="text-xs font-medium text-slate-400 mt-1">{target}</div> : null}

        {trend ? (
          <div className="flex items-center gap-1.5 text-xs mt-1.5">
            <span
              className={cn(
                'font-semibold tabular-nums px-1.5 py-0.5 rounded text-[11px] border',
                trend.isPositive === undefined
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : trend.isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30',
              )}
            >
              {trend.value}
            </span>
            <span className="text-slate-400">{trend.label}</span>
          </div>
        ) : null}

        {hint ? <div className="text-xs font-medium text-slate-400 mt-1">{hint}</div> : null}
      </div>

      {link ? (
        <div className="pt-2 border-t border-slate-800 mt-2">
          <Link
            to={link.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors min-h-[44px] py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <span>{link.text || 'Batafsil'}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
