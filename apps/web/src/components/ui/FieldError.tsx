import { cn } from '@/lib/utils';

export function FieldError({
  id,
  children,
  className,
}: {
  id?: string;
  children?: string | null;
  className?: string;
}): React.ReactElement | null {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn('mt-1 text-xs text-red-600', className)}>
      {children}
    </p>
  );
}
