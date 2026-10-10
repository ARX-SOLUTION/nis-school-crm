import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ' +
  'disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] touch-manipulation select-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm shadow-blue-950/50 border border-blue-500/35 hover:border-blue-400/60',
  secondary:
    'bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-600 active:bg-slate-700',
  outline:
    'bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-600',
  ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/80',
  destructive:
    'bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-600 hover:text-white hover:border-red-600 active:bg-red-700',
  link: 'bg-transparent text-blue-400 rounded-none p-0 hover:underline hover:text-blue-300',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] h-9 px-3 text-xs',
  md: 'min-h-[42px] h-10 px-4 text-sm',
  lg: 'min-h-[48px] h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, children, disabled, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], variant === 'link' ? '' : sizes[size], className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
