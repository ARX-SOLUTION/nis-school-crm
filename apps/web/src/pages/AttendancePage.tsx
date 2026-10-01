import React, { useState } from 'react';
import type { BulkAttendanceItemDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { useStudentsQuery } from '@/features/students/api/use-students-query';
import {
  useAttendanceQuery,
  useBulkAttendanceMutation,
} from '@/features/attendance/api/use-attendance-queries';
import { AttendanceSheet } from '@/features/attendance/components/AttendanceSheet';

export function AttendancePage(): React.ReactElement {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const { data: classesData, isLoading: classesLoading } = useClassesQuery({
    page: 1,
    limit: 50,
  });

  const classes = classesData?.data ?? [];
  const activeClassId = selectedClassId || (classes.length > 0 ? classes[0].id : '');

  const { data: studentsData, isLoading: studentsLoading } = useStudentsQuery(
    { classId: activeClassId, limit: 100 },
    { enabled: Boolean(activeClassId) },
  );

  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendanceQuery(
    activeClassId && selectedDate ? { classId: activeClassId, date: selectedDate } : undefined,
    { enabled: Boolean(activeClassId && selectedDate) },
  );

  const bulkMutation = useBulkAttendanceMutation();

  const handleSave = async (records: BulkAttendanceItemDto[]) => {
    if (!activeClassId || !selectedDate) return;
    setSaveSuccess(false);
    await bulkMutation.mutateAsync({
      classId: activeClassId,
      date: selectedDate,
      records,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const students = studentsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-tertiary">
            Davomat Jurnali (Attendance)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kunlik o'quvchilar darsga qatnashuvi, kechikishlar va sababli qoldirishlar jurnali.
          </p>
        </div>
        {saveSuccess ? (
          <div className="inline-flex items-center gap-2 bg-[#E8F7D0] border border-success text-success text-sm font-semibold px-4 py-2 rounded-lg animate-in fade-in">
            <svg
              className="w-5 h-5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Davomat muvaffaqiyatli saqlandi!
          </div>
        ) : null}
      </div>

      {/* Class & Date Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="class-select" className="text-sm font-medium text-tertiary">
              Sinf:
            </label>
            <select
              id="class-select"
              value={activeClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={classesLoading || classes.length === 0}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {classes.length === 0 ? (
                <option value="">Sinflar mavjud emas</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Grade {cls.gradeLevel})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="date-select" className="text-sm font-medium text-tertiary">
              Sana:
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* Attendance Sheet or Loader */}
      {classesLoading || (activeClassId && (studentsLoading || attendanceLoading)) ? (
        <LoadingState label="Davomat ma'lumotlari yuklanmoqda..." />
      ) : (
        <AttendanceSheet
          students={students}
          existingRecords={attendanceRecords}
          date={selectedDate}
          onSave={handleSave}
          isSaving={bulkMutation.isPending}
        />
      )}
    </div>
  );
}
