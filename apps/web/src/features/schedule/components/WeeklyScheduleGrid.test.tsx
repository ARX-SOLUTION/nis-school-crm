import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScheduleEntryResponseDto } from '@nis/shared';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';

const mockEntry: ScheduleEntryResponseDto = {
  id: 'sched-1',
  classId: 'class-1',
  subjectId: 'Mathematics',
  teacherId: 'teacher-1',
  roomId: '101',
  dayOfWeek: 'MONDAY',
  lessonNumber: 1,
  startTime: '08:30:00',
  endTime: '09:15:00',
  effectiveFrom: '2026-09-01',
  effectiveTo: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('WeeklyScheduleGrid', () => {
  it('renders empty state when no entries are present with class name', () => {
    render(<WeeklyScheduleGrid entries={[]} classNameLabel="Grade 5-A" />);
    expect(screen.getByText('No timetable entries scheduled')).toBeInTheDocument();
    expect(
      screen.getByText('No lessons have been scheduled for Grade 5-A yet.'),
    ).toBeInTheDocument();
  });

  it('renders timetable table headers and entries when provided', () => {
    render(<WeeklyScheduleGrid entries={[mockEntry]} classNameLabel="Grade 5-A" />);
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
  });
});
