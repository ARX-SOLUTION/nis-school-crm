import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] touch-manipulation';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-tertiary hover:bg-primary-hover shadow-[0_2px_10px_-3px_rgba(132,204,22,0.4)]',
  secondary: 'bg-surface text-tertiary border border-border hover:bg-muted-surface',
  outline: 'bg-surface text-tertiary border border-border hover:bg-muted-surface',
  ghost: 'text-neutral-500 hover:text-tertiary hover:bg-muted-surface',
  destructive: 'bg-error text-surface hover:bg-red-600',
  link: 'bg-transparent text-secondary rounded-none p-0 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-[36px] h-9 px-3 text-sm',
  md: 'min-h-[48px] h-12 px-4 text-[16px]',
  lg: 'min-h-[56px] h-14 px-6 text-lg',
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
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-tertiary border-t-transparent" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
