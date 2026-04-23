import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...rest }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-slate-800 mb-1', className)}
      {...rest}
    />
  ),
);
Label.displayName = 'Label';
