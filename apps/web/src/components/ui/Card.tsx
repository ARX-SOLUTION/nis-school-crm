import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'elevated' | 'metric';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'rounded-xl border border-border bg-surface shadow-dark-sm text-tertiary',
  elevated:
    'rounded-xl border border-slate-700 bg-surface shadow-dark-md text-tertiary hover:border-slate-600 transition-all duration-150',
  metric: 'rounded-xl border border-border bg-surface shadow-dark-sm p-3.5 sm:p-5 text-tertiary',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...rest }, ref) => (
    <div ref={ref} className={cn(variantStyles[variant], className)} {...rest} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border/80',
        className,
      )}
      {...rest}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...rest }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold text-slate-100 tracking-tight', className)}
      {...rest}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...rest }, ref) => (
  <p ref={ref} className={cn('text-xs text-slate-400 mt-0.5', className)} {...rest} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('p-3.5 sm:p-5 text-sm text-slate-300', className)} {...rest} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between px-5 py-3.5 border-t border-border/80 text-xs text-slate-400',
        className,
      )}
      {...rest}
    />
  ),
);
CardFooter.displayName = 'CardFooter';
