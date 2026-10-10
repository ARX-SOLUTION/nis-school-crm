import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatCard } from './StatCard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    to?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('StatCard', () => {
  it('should_render_label_and_value', () => {
    render(<StatCard label="Students" value={42} />);
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should_render_hint_when_provided', () => {
    render(<StatCard label="Classes" value={4} hint="~75% fill" />);
    expect(screen.getByText(/~75% fill/)).toBeInTheDocument();
  });

  it('should_render_target_and_trend_when_provided', () => {
    render(
      <StatCard
        label="Collection Rate"
        value="85%"
        target="Maqsad: 100%"
        trend={{ value: '+5%', isPositive: true, label: "o'tgan oyga nisbatan" }}
      />,
    );

    expect(screen.getByText('Maqsad: 100%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText("o'tgan oyga nisbatan")).toBeInTheDocument();
  });

  it('should_render_accessible_link_with_touch_target', () => {
    render(
      <StatCard
        label="Arrears"
        value="12 500 000 so'm"
        link={{ href: '/billing', text: "To'lovlar bo'limi" }}
      />,
    );

    const link = screen.getByRole('link', { name: /to'lovlar bo'limi/i });
    expect(link).toHaveAttribute('href', '/billing');
    expect(link).toHaveClass('min-h-[44px]');
  });

  it('should_apply_critical_and_warning_tones', () => {
    const { rerender, container } = render(
      <StatCard label="Compliance" value="65%" tone="critical" />,
    );
    expect(container.firstChild).toHaveClass('border-l-error');

    rerender(<StatCard label="Compliance" value="85%" tone="warning" />);
    expect(container.firstChild).toHaveClass('border-l-amber-500');
  });
});
