import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StudentResponseDto } from '@nis/shared';
import { StudentProfileModal } from './StudentProfileModal';

vi.mock('@/features/attendance/api/attendance-api', () => ({
  attendanceApi: {
    getStats: vi.fn().mockResolvedValue({
      totalDays: 10,
      presentCount: 9,
      absentCount: 1,
      lateCount: 0,
      excusedCount: 0,
      ratePercentage: 90,
    }),
  },
}));

vi.mock('@/features/grades/api/grades-api', () => ({
  gradesApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: 'g-1',
        studentId: 's-1',
        score: 5,
        maxScore: 5,
        gradeType: 'CLASSWORK',
        date: '2026-09-25',
        comment: "A'lo javob",
      },
    ]),
  },
}));

vi.mock('@/features/billing/api/billing-api', () => ({
  billingApi: {
    listPayments: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p-1',
          studentId: 's-1',
          amount: 1500000,
          method: 'CASH',
          paidAt: '2026-09-01T10:00:00.000Z',
          status: 'CONFIRMED',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  },
}));

const mockStudent: StudentResponseDto = {
  id: 's-1',
  studentCode: 'NIS-2026-00001',
  firstName: 'Shaxzod',
  lastName: 'Karimov',
  middleName: null,
  birthDate: '2015-03-15',
  gender: 'MALE',
  gradeLevel: 4,
  classId: null,
  status: 'ACTIVE',
  parentFullName: 'Karimov Olim',
  parentPhone: '+998901234567',
  parentTelegram: 'olim_karimov',
  enrolledAt: '2026-09-01T00:00:00.000Z',
  leftAt: null,
  leftReason: null,
  createdAt: '2026-09-01T00:00:00.000Z',
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('StudentProfileModal', () => {
  it('should_render_student_identity_and_parent_info', () => {
    renderWithClient(<StudentProfileModal open={true} student={mockStudent} onClose={vi.fn()} />);

    expect(screen.getByText('Karimov Shaxzod')).toBeInTheDocument();
    expect(screen.getByText("O'quvchi kodi: NIS-2026-00001")).toBeInTheDocument();
    expect(screen.getByText('Karimov Olim')).toBeInTheDocument();
    expect(screen.getByText('+998901234567')).toBeInTheDocument();
    expect(screen.getByText('@olim_karimov')).toBeInTheDocument();
  });

  it('should_switch_tabs_and_fetch_attendance_and_grades', async () => {
    renderWithClient(<StudentProfileModal open={true} student={mockStudent} onClose={vi.fn()} />);

    // Switch to Davomat tab
    const davomatTab = screen.getByRole('tab', { name: /davomat/i });
    await userEvent.click(davomatTab);
    expect(await screen.findByText('90%')).toBeInTheDocument();
    expect(screen.getByText('Qatnashish')).toBeInTheDocument();

    // Switch to Baholar tab
    const baholarTab = screen.getByRole('tab', { name: /baholar/i });
    await userEvent.click(baholarTab);
    expect(await screen.findByText("A'lo javob")).toBeInTheDocument();
  });

  it('should_call_onClose_when_close_button_clicked', async () => {
    const onClose = vi.fn();
    renderWithClient(<StudentProfileModal open={true} student={mockStudent} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /yopish/i });
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
