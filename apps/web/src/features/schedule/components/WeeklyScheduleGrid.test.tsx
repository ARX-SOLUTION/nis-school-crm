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

  it('resolves human-readable names from lookups instead of raw UUIDs', () => {
    const entryWithUuids: ScheduleEntryResponseDto = {
      ...mockEntry,
      subjectId: 'sub-uuid-101',
      roomId: 'room-uuid-202',
      teacherId: 'teacher-uuid-303',
    };

    render(
      <WeeklyScheduleGrid
        entries={[entryWithUuids]}
        classNameLabel="Grade 7-B"
        subjects={[{ id: 'sub-uuid-101', name: 'Fizika va Astronomiya' }]}
        rooms={[{ id: 'room-uuid-202', number: '304-Xona' }]}
        teachers={[{ id: 'teacher-uuid-303', fullName: 'Anvar Rahimov' }]}
      />,
    );

    expect(screen.getByText('Fizika va Astronomiya')).toBeInTheDocument();
    expect(screen.getByText('Room 304-Xona')).toBeInTheDocument();
    expect(screen.getByText('Anvar Rahimov')).toBeInTheDocument();
  });

  it('displays fallback strings when subject or room lookup is missing', () => {
    const entryWithMissingLookups: ScheduleEntryResponseDto = {
      ...mockEntry,
      subjectId: 'sub-unknown-999',
      roomId: 'room-unknown-999',
      teacherId: 'teacher-unknown-999',
    };

    render(
      <WeeklyScheduleGrid
        entries={[entryWithMissingLookups]}
        classNameLabel="Grade 8-A"
        subjects={[]}
        rooms={[]}
        teachers={[]}
      />,
    );

    expect(screen.getByText("Noma'lum fan")).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
