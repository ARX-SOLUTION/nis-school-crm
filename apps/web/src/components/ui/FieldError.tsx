import { cn } from '@/lib/utils';

export function FieldError({
  id,
  children,
  message,
  className,
}: {
  id?: string;
  children?: string | null;
  message?: string | null;
  className?: string;
}): React.ReactElement | null {
  const text = message || children;
  if (!text) return null;
  return (
    <p id={id} role="alert" className={cn('mt-1 text-xs text-red-600', className)}>
      {text}
    </p>
  );
}
