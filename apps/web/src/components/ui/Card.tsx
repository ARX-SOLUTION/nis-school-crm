import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';
