import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StudentGradeSummaryDto, StudentResponseDto } from '@nis/shared';
import { GradesSheet } from './GradesSheet';

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

const mockSummary: StudentGradeSummaryDto = {
  studentId: 's-1',
  studentName: 'Karimov Shaxzod',
  averageScore: 4.5,
  grades: [
    {
      id: 'g-1',
      studentId: 's-1',
      teacherId: 't-1',
      classId: 'c-1',
      subjectId: 'sub-1',
      date: '2026-09-26',
      score: 5,
      maxScore: 5,
      gradeType: 'CLASSWORK',
      comment: 'Barakalla',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'g-2',
      studentId: 's-1',
      teacherId: 't-1',
      classId: 'c-1',
      subjectId: 'sub-1',
      date: '2026-09-27',
      score: 4,
      maxScore: 5,
      gradeType: 'HOMEWORK',
      comment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

describe('GradesSheet', () => {
  it('should_render_empty_state_when_no_students', () => {
    render(
      <GradesSheet
        students={[]}
        summaries={[]}
        classId="c-1"
        subjectId="sub-1"
        onRecordGrade={vi.fn()}
      />,
    );
    expect(screen.getByText("O'quvchilar mavjud emas")).toBeInTheDocument();
  });

  it('should_render_student_and_grade_summary', () => {
    render(
      <GradesSheet
        students={[mockStudent()]}
        summaries={[mockSummary]}
        classId="c-1"
        subjectId="sub-1"
        onRecordGrade={vi.fn()}
      />,
    );
    expect(screen.getByText(/karimov shaxzod/i)).toBeInTheDocument();
    expect(screen.getByText('NIS-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should_call_onRecordGrade_when_quick_add_button_clicked', async () => {
    const handleRecord = vi.fn().mockResolvedValue(undefined);
    render(
      <GradesSheet
        students={[mockStudent()]}
        summaries={[mockSummary]}
        classId="c-1"
        subjectId="sub-1"
        onRecordGrade={handleRecord}
      />,
    );

    const button5 = screen.getByRole('button', { name: '5' });
    await userEvent.click(button5);

    expect(handleRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 's-1',
        classId: 'c-1',
        subjectId: 'sub-1',
        score: 5,
        gradeType: 'CLASSWORK',
      }),
    );
  });

  it('should_allow_selecting_grade_type_and_recording', async () => {
    const handleRecord = vi.fn().mockResolvedValue(undefined);
    render(
      <GradesSheet
        students={[mockStudent()]}
        summaries={[mockSummary]}
        classId="c-1"
        subjectId="sub-1"
        onRecordGrade={handleRecord}
      />,
    );

    const homeworkBtn = screen.getByRole('button', { name: /uyga vazifa/i });
    await userEvent.click(homeworkBtn);

    const button4 = screen.getByRole('button', { name: '4' });
    await userEvent.click(button4);

    expect(handleRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 's-1',
        score: 4,
        gradeType: 'HOMEWORK',
      }),
    );
  });
});
