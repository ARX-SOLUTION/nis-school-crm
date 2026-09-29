import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReportsPage } from '@/pages/ReportsPage';

vi.mock('@/features/reports/api/use-reports-queries', () => ({
  useAttendanceReportQuery: () => ({
    data: [
      {
        classId: 'cls-1',
        className: '7-A',
        gradeLevel: 7,
        totalStudents: 25,
        totalRecords: 500,
        presentCount: 450,
        absentCount: 30,
        lateCount: 15,
        excusedCount: 5,
        attendanceRate: 94,
        month: '2026-09',
      },
    ],
    isLoading: false,
  }),
  useGradesReportQuery: () => ({
    data: {
      subjects: [
        {
          subjectId: 'sub-1',
          subjectName: 'Matematika',
          classId: 'cls-1',
          className: '7-A',
          totalRecorded: 100,
          averageScore: 78.5,
          highestScore: 5,
          lowestScore: 2,
          passingCount: 85,
          passingRate: 85,
        },
      ],
      topStudents: [
        {
          studentId: 'stu-1',
          studentName: 'Karimov Shaxzod',
          studentCode: 'NIS-001',
          className: '7-A',
          averageScore: 96.5,
          totalGrades: 50,
        },
      ],
    },
    isLoading: false,
  }),
  useFinanceReportQuery: () => ({
    data: {
      months: [
        {
          month: '2026-04',
          totalCollected: 50000000,
          totalExpected: 75000000,
          collectionRate: 67,
          paymentCount: 20,
        },
        {
          month: '2026-05',
          totalCollected: 60000000,
          totalExpected: 75000000,
          collectionRate: 80,
          paymentCount: 24,
        },
        {
          month: '2026-06',
          totalCollected: 70000000,
          totalExpected: 75000000,
          collectionRate: 93,
          paymentCount: 28,
        },
      ],
      totalCollectedPeriod: 180000000,
      averageMonthlyRevenue: 60000000,
    },
    isLoading: false,
  }),
}));

describe('ReportsPage', () => {
  it('renders page title', () => {
    render(<ReportsPage />);
    expect(screen.getByText('Hisobotlar va Tahlil')).toBeInTheDocument();
  });

  it('shows attendance tab by default with class data', () => {
    render(<ReportsPage />);
    expect(screen.getByText('7-A')).toBeInTheDocument();
    // attendanceRate 94% appears in both KPI bar and table row
    expect(screen.getAllByText('94%').length).toBeGreaterThan(0);
  });

  it('switches to grades tab and shows subject data', async () => {
    render(<ReportsPage />);
    const gradesTab = screen.getByRole('button', { name: /baholar/i });
    await userEvent.click(gradesTab);
    expect(screen.getByText('Matematika')).toBeInTheDocument();
    expect(screen.getByText('Karimov Shaxzod')).toBeInTheDocument();
  });

  it('switches to finance tab and shows revenue data', async () => {
    render(<ReportsPage />);
    const financeTab = screen.getByRole('button', { name: /moliya/i });
    await userEvent.click(financeTab);
    // totalCollectedPeriod 180000000 => '180 mln so\'m'
    expect(screen.getByText(/180.*mln.*so'm/)).toBeInTheDocument();
    expect(screen.getByText('2026-04')).toBeInTheDocument();
    expect(screen.getByText('2026-06')).toBeInTheDocument();
  });
});
