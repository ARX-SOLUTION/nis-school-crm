import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 caret-blue-400 transition-all duration-150',
      'placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:shadow-[0_0_8px_rgba(59,130,246,0.25)]',
      'aria-invalid:border-red-500 aria-invalid:ring-1 aria-invalid:ring-red-500 aria-invalid:shadow-[0_0_8px_rgba(239,68,68,0.2)]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-950',
      className,
    )}
    {...rest}
  />
));
Input.displayName = 'Input';
