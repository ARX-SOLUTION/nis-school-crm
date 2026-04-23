import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

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

  it('should_render_string_value', () => {
    render(<StatCard label="Status" value="OK" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
