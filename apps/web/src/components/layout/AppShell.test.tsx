import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserResponseDto } from '@nis/shared';
import { AppShell } from './AppShell';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: vi.fn(() => '/'),
}));

const mockLogoutMutate = vi.fn();
vi.mock('@/features/auth/api/use-logout-mutation', () => ({
  useLogoutMutation: () => ({
    mutate: mockLogoutMutate,
    isPending: false,
  }),
}));

const mockUser: UserResponseDto = {
  id: 'user-123',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  phone: null,
  telegramUsername: null,
  role: 'SUPER_ADMIN',
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

function renderAppShell(user = mockUser) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppShell user={user}>
        <div>Test Page Content</div>
      </AppShell>
    </QueryClientProvider>,
  );
}

describe('AppShell Layout', () => {
  it('renders left desktop sidebar with brand and navigation links', () => {
    renderAppShell();
    expect(screen.getAllByText('Nordic CRM')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Users')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Classes')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Schedule')[0]).toBeInTheDocument();
    expect(screen.getByText('Test Page Content')).toBeInTheDocument();
  });

  it('renders profile button in top-right area and opens profile card on click', () => {
    renderAppShell();

    // Profile trigger button
    const profileBtn = screen.getByRole('button', { name: /User profile menu/i });
    expect(profileBtn).toBeInTheDocument();

    // Profile card should be closed initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Click profile button to open profile card popover
    fireEvent.click(profileBtn);

    // Profile card popover should be visible with user information
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /My Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sign out/i })).toBeInTheDocument();
  });

  it('closes profile card on Escape key press', () => {
    renderAppShell();
    const profileBtn = screen.getByRole('button', { name: /User profile menu/i });

    fireEvent.click(profileBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('triggers logout mutation when clicking Sign out inside profile card', () => {
    renderAppShell();
    const profileBtn = screen.getByRole('button', { name: /User profile menu/i });

    fireEvent.click(profileBtn);
    const signOutBtn = screen.getByRole('menuitem', { name: /Sign out/i });
    fireEvent.click(signOutBtn);

    expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggles desktop sidebar collapsed state when clicking collapse/expand button', () => {
    localStorage.clear();
    renderAppShell();

    // Initially expanded
    expect(screen.getAllByText('Nordic CRM')[0]).toBeInTheDocument();

    // Click collapse button
    const collapseBtns = screen.getAllByRole('button', { name: /Collapse sidebar/i });
    expect(collapseBtns.length).toBeGreaterThan(0);
    fireEvent.click(collapseBtns[0]);

    // Should be persisted in localStorage
    expect(localStorage.getItem('nis_sidebar_collapsed')).toBe('true');

    // Expand button should now be available
    const expandBtns = screen.getAllByRole('button', { name: /Expand sidebar/i });
    expect(expandBtns.length).toBeGreaterThan(0);

    // Click expand button to restore
    fireEvent.click(expandBtns[0]);
    expect(localStorage.getItem('nis_sidebar_collapsed')).toBe('false');
  });

  it('toggles sidebar on Ctrl+B or Cmd+B keyboard shortcut', () => {
    localStorage.clear();
    renderAppShell();

    // Press Ctrl+B to collapse
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(localStorage.getItem('nis_sidebar_collapsed')).toBe('true');

    // Press Cmd+B to expand
    fireEvent.keyDown(window, { key: 'B', metaKey: true });
    expect(localStorage.getItem('nis_sidebar_collapsed')).toBe('false');
  });
});
