import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationPreferencesCard } from './NotificationPreferencesCard';
import { profileApi } from '../api/profile-api';

vi.mock('../api/profile-api', () => ({
  profileApi: {
    changePassword: vi.fn(),
    generateTelegramLinkCode: vi.fn(),
    updateNotificationPrefs: vi.fn(),
  },
}));

describe('NotificationPreferencesCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(profileApi.updateNotificationPrefs).mockResolvedValue({
      id: 'u-1',
      email: 'admin@nis.uz',
      role: 'ADMIN',
      fullName: 'Admin User',
      phone: null,
      isActive: true,
      mustChangePassword: false,
      telegramUsername: null,
      notificationPrefs: {
        telegramAttendance: false,
        telegramGrades: true,
      },
      lastLoginAt: null,
      createdAt: '2026-01-01',
    });
  });

  const renderCard = (initialPrefs?: Record<string, boolean>) =>
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationPreferencesCard initialPrefs={initialPrefs} />
      </QueryClientProvider>,
    );

  it('renders preference list with default active status', () => {
    renderCard({ telegramAttendance: true, telegramGrades: false });

    expect(screen.getByText('Bildirishnoma sozlamalari')).toBeInTheDocument();
    expect(screen.getByText('Telegram davomat xabarlari')).toBeInTheDocument();
    expect(screen.getByText('Baholar va choraklik natijalar')).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(4);
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles switch state and saves preferences on button click', async () => {
    renderCard({ telegramAttendance: true });

    const attendanceSwitch = screen.getByRole('switch', { name: /telegram davomat xabarlari/i });
    expect(attendanceSwitch).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(attendanceSwitch);
    expect(attendanceSwitch).toHaveAttribute('aria-checked', 'false');

    const saveButton = screen.getByRole('button', { name: /saqlash/i });
    await userEvent.click(saveButton);

    expect(profileApi.updateNotificationPrefs).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramAttendance: false,
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/muvaffaqiyatli saqlandi/i);
  });
});
