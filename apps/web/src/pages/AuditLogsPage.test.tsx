import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsPage } from './AuditLogsPage';
import { auditApi } from '@/features/audit/api/audit-api';

vi.mock('@/features/audit/api/audit-api', () => ({
  auditApi: {
    list: vi.fn(),
  },
}));

describe('AuditLogsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuditLogsPage />
      </QueryClientProvider>,
    );

  it('renders loading state initially', () => {
    vi.mocked(auditApi.list).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Audit loglari yuklanmoqda...')).toBeInTheDocument();
  });

  it('renders table headers and audit log rows', async () => {
    vi.mocked(auditApi.list).mockResolvedValue({
      data: [
        {
          id: 'log-1',
          userId: 'user-uuid-1',
          action: 'CREATE_STUDENT',
          entityType: 'Student',
          entityId: 'student-uuid-1',
          ipAddress: '127.0.0.1',
          statusCode: 201,
          oldData: null,
          newData: { name: 'Alisher' },
          createdAt: '2026-10-04T10:00:00.000Z',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    renderPage();

    expect(await screen.findByText('CREATE_STUDENT')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Student' })).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('user-uuid-1')).toBeInTheDocument();

    // Verify copy buttons are rendered with accessible labels
    expect(
      screen.getByRole('button', { name: /foydalanuvchi id nusxalash: user-uuid-1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ob'ekt id nusxalash: student-uuid-1/i }),
    ).toBeInTheDocument();

    // Verify pagination is rendered when meta.total > 0
    expect(screen.getByRole('navigation', { name: /sahifalar/i })).toBeInTheDocument();
    expect(screen.getByText(/ko'rsatilmoqda/i)).toBeInTheDocument();
  });

  it('renders empty state when no logs returned', async () => {
    vi.mocked(auditApi.list).mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    });

    renderPage();

    expect(await screen.findByText('Hech qanday audit log topilmadi')).toBeInTheDocument();
  });

  it('updates filters and triggers query with filter values', async () => {
    const user = userEvent.setup();
    vi.mocked(auditApi.list).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    renderPage();

    const actionSelect = screen.getByLabelText(/amal bo‘yicha filtr/i);
    await user.selectOptions(actionSelect, 'UPDATE');

    expect(auditApi.list).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
      }),
    );

    const entitySelect = screen.getByLabelText(/ob'ekt turi bo‘yicha filtr/i);
    await user.selectOptions(entitySelect, 'Student');

    expect(auditApi.list).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Student',
      }),
    );
  });
});
