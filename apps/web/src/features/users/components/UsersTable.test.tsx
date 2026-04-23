import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UserResponseDto } from '@nis/shared';
import { UsersTable } from './UsersTable';

const user = (over: Partial<UserResponseDto> = {}): UserResponseDto => ({
  id: 'u-1',
  email: 'ali@nis.uz',
  fullName: 'Ali Valiyev',
  phone: null,
  role: 'MANAGER',
  telegramUsername: null,
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

describe('UsersTable', () => {
  it('should_render_row_with_name_email_and_role', () => {
    render(<UsersTable data={[user()]} />);
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText('ali@nis.uz')).toBeInTheDocument();
    expect(screen.getByText('MANAGER')).toBeInTheDocument();
  });

  it('should_render_empty_state_when_no_rows', () => {
    render(<UsersTable data={[]} />);
    expect(screen.getByText(/no users/i)).toBeInTheDocument();
  });

  it('should_show_loading_message_when_loading_and_empty', () => {
    render(<UsersTable data={[]} isLoading />);
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
  });

  it('should_show_disabled_badge_for_inactive_users', () => {
    render(<UsersTable data={[user({ isActive: false })]} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should_call_onResetPassword_when_reset_clicked', async () => {
    const reset = vi.fn();
    render(<UsersTable data={[user()]} onResetPassword={reset} />);
    await userEvent.click(screen.getByRole('button', { name: /reset password for ali/i }));
    expect(reset).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-1' }));
  });

  it('should_call_onDelete_when_delete_clicked', async () => {
    const del = vi.fn();
    render(<UsersTable data={[user()]} onDelete={del} />);
    await userEvent.click(screen.getByRole('button', { name: /delete ali/i }));
    expect(del).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-1' }));
  });
});
