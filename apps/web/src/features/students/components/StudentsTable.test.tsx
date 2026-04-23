import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StudentResponseDto } from '@nis/shared';
import { StudentsTable } from './StudentsTable';

const student = (over: Partial<StudentResponseDto> = {}): StudentResponseDto => ({
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
  parentPhone: null,
  parentTelegram: null,
  enrolledAt: new Date().toISOString(),
  leftAt: null,
  leftReason: null,
  createdAt: new Date().toISOString(),
  ...over,
});

describe('StudentsTable', () => {
  it('should_render_row_with_name_and_code', () => {
    render(<StudentsTable data={[student()]} />);
    expect(screen.getByText('NIS-2026-00001')).toBeInTheDocument();
    expect(screen.getByText(/karimov shaxzod/i)).toBeInTheDocument();
  });

  it('should_render_empty_state', () => {
    render(<StudentsTable data={[]} />);
    expect(screen.getByText(/no students/i)).toBeInTheDocument();
  });

  it('should_hide_archive_button_for_inactive_students', () => {
    render(<StudentsTable data={[student({ status: 'INACTIVE' })]} onArchive={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /archive karimov/i })).not.toBeInTheDocument();
  });

  it('should_show_archived_badge_for_inactive_students', () => {
    render(<StudentsTable data={[student({ status: 'INACTIVE' })]} />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should_call_onAssignClass_when_clicked', async () => {
    const fn = vi.fn();
    render(<StudentsTable data={[student()]} onAssignClass={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /assign class for karimov/i }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 's-1' }));
  });

  it('should_call_onArchive_when_clicked', async () => {
    const fn = vi.fn();
    render(<StudentsTable data={[student()]} onArchive={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /archive karimov/i }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 's-1' }));
  });
});
