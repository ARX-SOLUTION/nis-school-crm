import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClassResponseDto } from '@nis/shared';
import { ClassesTable } from './ClassesTable';

const klass = (over: Partial<ClassResponseDto> = {}): ClassResponseDto => ({
  id: 'c-1',
  name: '4-A',
  gradeLevel: 4,
  academicYear: '2026-2027',
  maxStudents: 30,
  roomNumber: '201',
  classTeacherId: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  ...over,
});

describe('ClassesTable', () => {
  it('should_render_row_with_name_and_grade', () => {
    render(<ClassesTable data={[klass()]} />);
    expect(screen.getByText('4-A')).toBeInTheDocument();
    expect(screen.getByText('2026-2027')).toBeInTheDocument();
  });

  it('should_show_empty_state_when_no_rows', () => {
    render(<ClassesTable data={[]} />);
    expect(screen.getByText(/no classes/i)).toBeInTheDocument();
  });

  it('should_show_loading_when_isLoading_and_empty', () => {
    render(<ClassesTable data={[]} isLoading />);
    expect(screen.getByText(/loading classes/i)).toBeInTheDocument();
  });

  it('should_call_onAssignTeacher_when_clicked', async () => {
    const fn = vi.fn();
    render(<ClassesTable data={[klass()]} onAssignTeacher={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /assign teacher to 4-a/i }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-1' }));
  });

  it('should_call_onDelete_when_delete_clicked', async () => {
    const fn = vi.fn();
    render(<ClassesTable data={[klass()]} onDelete={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /delete class 4-a/i }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-1' }));
  });
});
