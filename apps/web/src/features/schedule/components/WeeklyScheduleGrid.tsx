import React from 'react';
import { DAYS_OF_WEEK, type ScheduleEntryResponseDto } from '@nis/shared';
import { EmptyState } from '@/components/ui/EmptyState';

export interface SubjectLookup {
  id: string;
  name: string;
}

export interface RoomLookup {
  id: string;
  number?: string | null;
  name?: string | null;
}

export interface TeacherLookup {
  id: string;
  fullName: string;
}

export interface WeeklyScheduleGridProps {
  entries: ScheduleEntryResponseDto[];
  classNameLabel?: string;
  subjects?: SubjectLookup[] | Record<string, string>;
  rooms?: RoomLookup[] | Record<string, string>;
  teachers?: TeacherLookup[] | Record<string, string>;
}

const PERIOD_TIMES: Record<number, string> = {
  1: '08:30 - 09:15',
  2: '09:25 - 10:10',
  3: '10:20 - 11:05',
  4: '11:25 - 12:10',
  5: '12:20 - 13:05',
  6: '13:25 - 14:10',
  7: '14:20 - 15:05',
};

const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export function WeeklyScheduleGrid({
  entries,
  classNameLabel,
  subjects,
  rooms,
  teachers,
}: WeeklyScheduleGridProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No timetable entries scheduled"
        description={
          classNameLabel
            ? `No lessons have been scheduled for ${classNameLabel} yet.`
            : 'Select a class or teacher to display their weekly schedule.'
        }
      />
    );
  }

  // Lookup helpers
  const getSubjectName = (subjectId: string): string => {
    if (!subjectId) return "Noma'lum fan";
    if (Array.isArray(subjects)) {
      const found = subjects.find((s) => s.id === subjectId);
      if (found) return found.name;
      return "Noma'lum fan";
    } else if (subjects && typeof subjects === 'object') {
      if (subjects[subjectId]) return subjects[subjectId];
      return "Noma'lum fan";
    }
    if (subjectId.includes('-') && subjectId.length >= 8) {
      return "Noma'lum fan";
    }
    return subjectId || "Noma'lum fan";
  };

  const getRoomLabel = (roomId: string): string => {
    if (!roomId) return '—';
    if (Array.isArray(rooms)) {
      const found = rooms.find((r) => r.id === roomId);
      if (found) return `Room ${found.number || found.name || roomId}`;
      return '—';
    } else if (rooms && typeof rooms === 'object') {
      if (rooms[roomId]) return `Room ${rooms[roomId]}`;
      return '—';
    }
    if (roomId.includes('-') && roomId.length >= 8) {
      return '—';
    }
    return `Room ${roomId}`;
  };

  const getTeacherName = (teacherId: string): string => {
    if (!teacherId) return 'Teacher';
    if (Array.isArray(teachers)) {
      const found = teachers.find((t) => t.id === teacherId);
      if (found) return found.fullName;
      return 'Teacher';
    } else if (teachers && typeof teachers === 'object') {
      if (teachers[teacherId]) return teachers[teacherId];
      return 'Teacher';
    }
    if (teacherId.includes('-') && teacherId.length > 10) {
      return 'Teacher';
    }
    return teacherId || 'Teacher';
  };

  // Map entries by day and lessonNumber
  const map: Record<string, ScheduleEntryResponseDto> = {};
  for (const entry of entries) {
    map[`${entry.dayOfWeek}_${entry.lessonNumber}`] = entry;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted-surface text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <th scope="col" className="p-3 w-28 text-center border-r border-border">
              Period / Time
            </th>
            {DAYS_OF_WEEK.map((day) => (
              <th
                key={day}
                scope="col"
                className="p-3 text-center border-r border-border last:border-r-0"
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {PERIOD_NUMBERS.map((period) => (
            <tr key={period} className="hover:bg-muted-surface">
              <td className="p-3 text-center border-r border-border bg-muted-surface font-mono text-xs">
                <div className="font-bold text-tertiary">Lesson {period}</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">{PERIOD_TIMES[period]}</div>
              </td>
              {DAYS_OF_WEEK.map((day) => {
                const item = map[`${day}_${period}`];
                return (
                  <td
                    key={`${day}_${period}`}
                    className="p-2 border-r border-border last:border-r-0 align-top min-w-[140px] h-20"
                  >
                    {item ? (
                      <div className="h-full rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-xs flex flex-col justify-between">
                        <div
                          className="font-semibold text-secondary truncate"
                          title={getSubjectName(item.subjectId)}
                        >
                          {getSubjectName(item.subjectId)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-secondary mt-1">
                          <span className="font-medium truncate max-w-[70px]">
                            {getRoomLabel(item.roomId)}
                          </span>
                          <span
                            className="text-secondary/80 truncate max-w-[80px]"
                            title={getTeacherName(item.teacherId)}
                          >
                            {getTeacherName(item.teacherId)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full rounded border border-dashed border-border bg-muted-surface flex items-center justify-center text-xs text-neutral-400">
                        Break
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
