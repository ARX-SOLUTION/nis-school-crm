import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchSwitcher } from './BranchSwitcher';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../api/use-branches-query', () => ({
  useBranchesQuery: () => ({
    data: [
      { id: 'b-1', name: 'Nordic International School - Bosh Bino', code: 'MAIN', isActive: true },
      {
        id: 'b-2',
        name: 'Nordic International School - Yunusobod',
        code: 'YUNUSOBOD',
        isActive: true,
      },
    ],
    isLoading: false,
  }),
}));

describe('BranchSwitcher', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    localStorage.clear();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BranchSwitcher />
      </QueryClientProvider>,
    );

  it('renders with default all branches or active branch', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /select branch/i })).toBeInTheDocument();
  });

  it('opens dropdown and displays available branches when clicked', async () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /select branch/i });
    await userEvent.click(button);

    expect(screen.getByText(/barcha filiallar \(umumiy\)/i)).toBeInTheDocument();
    expect(screen.getByText('Nordic International School - Bosh Bino')).toBeInTheDocument();
    expect(screen.getByText('Nordic International School - Yunusobod')).toBeInTheDocument();
  });

  it('switches branch and persists selection in localStorage', async () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /select branch/i });
    await userEvent.click(button);

    const yunusobodOption = screen.getByText('Nordic International School - Yunusobod');
    await userEvent.click(yunusobodOption);

    expect(localStorage.getItem('nis_active_branch_id')).toBe('b-2');
  });
});
