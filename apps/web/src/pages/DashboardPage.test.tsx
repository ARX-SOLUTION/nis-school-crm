import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserResponseDto } from '@nis/shared';
import { DashboardPage } from './DashboardPage';
import { dashboardApi } from '@/features/dashboard/api/dashboard-api';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/dashboard/api/dashboard-api', () => ({
  dashboardApi: {
    stats: vi.fn(),
    recentActivity: vi.fn(),
  },
}));

vi.mock('@/features/billing/api/billing-api', () => ({
  billingApi: {
    getStats: vi.fn(),
  },
}));

vi.mock('@/features/leads/api/leads-api', () => ({
  leadsApi: {
    getStats: vi.fn(),
  },
}));

vi.mock('@/features/reports/api/reports-api', () => ({
  reportsApi: {
    finance: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockUser: UserResponseDto = {
  id: 'u-1',
  email: 'admin@nis.uz',
  role: 'ADMIN',
  fullName: 'Anvar Aliyev',
  phone: null,
  isActive: true,
  mustChangePassword: false,
  telegramUsername: null,
  notificationPrefs: {},
  lastLoginAt: null,
  createdAt: '2026-01-01',
};

describe('DashboardPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(dashboardApi.stats).mockResolvedValue({
      role: 'ADMIN',
      teachersCount: 15,
      students: { active: 120, unassigned: 4, total: 120, archived: 0 },
      classes: { total: 8, averageFillPercent: 78, distribution: [] },
      newStudentsLast7Days: [
        { date: '2026-10-01', count: 2 },
        { date: '2026-10-02', count: 3 },
      ],
      compliance: {
        expectedClasses: 8,
        markedClasses: 8,
        rate: 100,
        thirtyDayMeanRate: 96.5,
        unmarkedClassesCount: 0,
      },
      collectionRateKpi: {
        current: 85,
        sameDayLastMonth: 80,
        isCritical: false,
      },
      arrearsKpi: {
        totalArrears: 12_500_000,
        previousMonthTotalArrears: 15_000_000,
        debtorCount: 5,
        priorMonthGapsCount: 0,
      },
      alerts: [],
    });
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage user={mockUser} />
      </QueryClientProvider>,
    );

  it('renders time-aware greeting, user first name, and consolidated subtitle', async () => {
    renderDashboard();

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/xayrli (tong|kun|kech), Anvar/i);
    expect(heading).toHaveClass('text-2xl', 'sm:text-4xl', 'md:text-5xl');

    expect(
      screen.getByText("Maktab bo'yicha umumiy ko'rsatkichlar va tezkor holat."),
    ).toBeInTheDocument();
  });

  it('renders Band 1 headline KPI cards with values, targets, trends, and links', async () => {
    renderDashboard();

    // 1. Collection Rate
    expect(await screen.findByText("To'lovlar yig'ish darajasi")).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Maqsad: 80%+')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /to'lovlar bo'limi/i })).toHaveAttribute(
      'href',
      '/billing',
    );

    // 2. Total Arrears
    expect(screen.getByText('Umumiy qarzdorlik')).toBeInTheDocument();
    expect(screen.getByText("0 so'm")).toBeInTheDocument();
    expect(screen.getByText(/-2.5 mln/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /qarzdorlar ro'yxati/i })).toHaveAttribute(
      'href',
      '/billing',
    );

    // 3. Attendance Compliance
    expect(screen.getByText('Davomat qamrovi')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Maqsad: 100%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /davomat jurnali/i })).toHaveAttribute(
      'href',
      '/attendance',
    );

    // 4. Enrolled Students
    expect(screen.getByText("Faol o'quvchilar")).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText("4 ta sinfsiz o'quvchi")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /o'quvchilar ro'yxati/i })).toHaveAttribute(
      'href',
      '/students',
    );
  });

  it('renders Band 0 alerts when present, and remains silent when empty', async () => {
    // When alerts are present
    vi.mocked(dashboardApi.stats).mockResolvedValueOnce({
      role: 'ADMIN',
      teachersCount: 15,
      students: { active: 120, unassigned: 4, total: 120, archived: 0 },
      classes: { total: 8, averageFillPercent: 78, distribution: [] },
      newStudentsLast7Days: [],
      compliance: {
        expectedClasses: 8,
        markedClasses: 6,
        rate: 75,
        thirtyDayMeanRate: 90,
        unmarkedClassesCount: 2,
      },
      collectionRateKpi: {
        current: 65,
        sameDayLastMonth: 80,
        isCritical: true,
      },
      arrearsKpi: {
        totalArrears: 20_000_000,
        previousMonthTotalArrears: 15_000_000,
        debtorCount: 8,
        priorMonthGapsCount: 2,
      },
      alerts: [
        {
          id: 'alert-unmarked-classes',
          level: 'critical',
          type: 'UNMARKED_CLASSES',
          title: 'Belgilanmagan darslar',
          count: 2,
          reason: 'Bugun 2 ta faol sinfda davomat belgilanmagan',
          link: '/attendance',
        },
      ],
    });

    renderDashboard();

    expect(await screen.findByText('Diqqat talab holatlar (1)')).toBeInTheDocument();
    expect(screen.getByText('Belgilanmagan darslar')).toBeInTheDocument();
    expect(screen.getByText('Kritik')).toBeInTheDocument();
    expect(screen.getByText('Bugun 2 ta faol sinfda davomat belgilanmagan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ko‘rish/i })).toHaveAttribute('href', '/attendance');
  });

  it('does NOT render the removed Recent Activity audit log feed', async () => {
    renderDashboard();

    expect(await screen.findByText("To'lovlar yig'ish darajasi")).toBeInTheDocument();
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Audit log entries from recent administrative actions/i),
    ).not.toBeInTheDocument();
  });

  it('renders methodology note explaining the 4 headline KPIs', async () => {
    renderDashboard();

    const noteButton = await screen.findByRole('button', {
      name: /hisoblash metodikasi va mezonlar/i,
    });
    expect(noteButton).toBeInTheDocument();
    expect(noteButton).toHaveAttribute('aria-expanded', 'false');
  });
});
