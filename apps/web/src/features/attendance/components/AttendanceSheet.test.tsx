import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StudentResponseDto } from '@nis/shared';
import { AttendanceSheet } from './AttendanceSheet';

const mockStudent = (over: Partial<StudentResponseDto> = {}): StudentResponseDto => ({
  id: 's-1',
  studentCode: 'NIS-2026-00001',
  firstName: 'Shaxzod',
  lastName: 'Karimov',
  middleName: null,
  birthDate: '2015-03-15',
  gender: 'MALE',
  gradeLevel: 4,
  classId: 'c-1',
  status: 'ACTIVE',
  parentFullName: 'Karimov Olim',
  parentPhone: null,
  parentTelegram: null,
  enrolledAt: new Date().toISOString(),
  leftAt: null,
  leftReason: null,
  createdAt: new Date().toISOString(),
  ...over,
});

describe('AttendanceSheet', () => {
  it('should_render_empty_state_when_no_students', () => {
    render(<AttendanceSheet students={[]} date="2026-09-27" onSave={vi.fn()} isSaving={false} />);
    expect(screen.getByText("O'quvchilar mavjud emas")).toBeInTheDocument();
  });

  it('should_render_student_list_and_metrics', () => {
    render(
      <AttendanceSheet
        students={[mockStudent()]}
        date="2026-09-27"
        onSave={vi.fn()}
        isSaving={false}
      />,
    );
    expect(screen.getByText(/karimov shaxzod/i)).toBeInTheDocument();
    expect(screen.getByText('NIS-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('Davomat: 100%')).toBeInTheDocument();
  });

  it('should_change_status_when_status_button_clicked', async () => {
    render(
      <AttendanceSheet
        students={[mockStudent()]}
        date="2026-09-27"
        onSave={vi.fn()}
        isSaving={false}
      />,
    );
    const absentButton = screen.getByRole('button', { name: /yo'q/i });
    await userEvent.click(absentButton);
    expect(screen.getByText('Davomat: 0%')).toBeInTheDocument();
  });

  it('should_mark_all_present_when_button_clicked', async () => {
    render(
      <AttendanceSheet
        students={[mockStudent()]}
        date="2026-09-27"
        existingRecords={[{ studentId: 's-1', status: 'ABSENT' }]}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );
    expect(screen.getByText('Davomat: 0%')).toBeInTheDocument();

    const markAllButton = screen.getByRole('button', { name: /barchasini "bor" qilish/i });
    await userEvent.click(markAllButton);

    expect(screen.getByText('Davomat: 100%')).toBeInTheDocument();
  });

  it('should_call_onSave_when_save_button_clicked', async () => {
    const handleSave = vi.fn();
    render(
      <AttendanceSheet
        students={[mockStudent()]}
        date="2026-09-27"
        onSave={handleSave}
        isSaving={false}
      />,
    );
    const saveButton = screen.getByRole('button', { name: /davomatni saqlash/i });
    await userEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith([
      expect.objectContaining({
        studentId: 's-1',
        status: 'PRESENT',
      }),
    ]);
  });
});
