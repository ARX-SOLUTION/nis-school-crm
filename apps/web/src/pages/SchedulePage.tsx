import React, { useState } from 'react';
import type { RoleName } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { useScheduleQuery } from '@/features/schedule/api/use-schedule-queries';
import { WeeklyScheduleGrid } from '@/features/schedule/components/WeeklyScheduleGrid';

interface Props {
  actorRole?: RoleName;
}

export function SchedulePage({ actorRole: _actorRole }: Props): React.ReactElement {
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classesData, isLoading: classesLoading } = useClassesQuery({
    page: 1,
    limit: 50,
  });

  const classes = classesData?.data ?? [];
  const activeClassId = selectedClassId || (classes.length > 0 ? classes[0].id : '');
  const selectedClass = classes.find((c) => c.id === activeClassId);

  const { data: scheduleEntries = [], isLoading: scheduleLoading } = useScheduleQuery(
    activeClassId ? { classId: activeClassId } : undefined,
    { enabled: Boolean(activeClassId) },
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-tertiary">Academic Schedule</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Weekly lesson timetable, room allocations, and teacher assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            Print Timetable
          </Button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="class-select" className="text-sm font-medium text-tertiary">
            Select Class:
          </label>
          <select
            id="class-select"
            value={activeClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classesLoading || classes.length === 0}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {classes.length === 0 ? (
              <option value="">No classes available</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Grade {cls.gradeLevel})
                </option>
              ))
            )}
          </select>
        </div>

        {selectedClass ? (
          <div className="text-xs text-neutral-500">
            Academic Year:{' '}
            <span className="font-semibold text-tertiary">{selectedClass.academicYear}</span>
            {selectedClass.roomNumber ? (
              <>
                {' '}
                | Default Room:{' '}
                <span className="font-semibold text-tertiary">{selectedClass.roomNumber}</span>
              </>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Schedule Timetable Grid */}
      {classesLoading || (activeClassId && scheduleLoading) ? (
        <LoadingState label="Loading academic schedule..." />
      ) : (
        <WeeklyScheduleGrid
          entries={scheduleEntries}
          classNameLabel={selectedClass ? selectedClass.name : undefined}
        />
      )}
    </div>
  );
}
