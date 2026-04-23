import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should_call_onSubmit_with_trimmed_values_when_valid', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@nis.uz');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorse');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      { email: 'admin@nis.uz', password: 'correcthorse' },
      expect.anything(),
    );
  });

  it('should_show_validation_error_when_email_invalid', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/password/i), 'longenough');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('should_show_validation_error_when_password_too_short', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@nis.uz');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('should_render_server_error_banner_when_errorMessage_is_set', () => {
    render(<LoginForm onSubmit={vi.fn()} errorMessage="Invalid credentials" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('should_disable_submit_while_isSubmitting', () => {
    render(<LoginForm onSubmit={vi.fn()} isSubmitting />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});
