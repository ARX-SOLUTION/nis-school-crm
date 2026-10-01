import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, hint, className }: Props): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border-none ring-1 ring-border bg-surface shadow-sm p-6 space-y-2 flex flex-col justify-center',
        className,
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="text-3xl font-bold tracking-tight text-tertiary">{value}</div>
      {hint ? <div className="text-sm font-medium text-neutral-500 mt-1">{hint}</div> : null}
    </div>
  );
}
