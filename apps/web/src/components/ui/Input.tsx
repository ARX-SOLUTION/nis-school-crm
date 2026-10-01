import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-12 w-full rounded-lg border border-border bg-surface px-4 py-3 text-[16px] text-tertiary transition-colors',
      'placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent',
      'focus-visible:ring-primary aria-invalid:border-error aria-invalid:ring-error',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...rest}
  />
));
Input.displayName = 'Input';
