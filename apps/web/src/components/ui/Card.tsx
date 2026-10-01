import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm p-6 text-tertiary',
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';
