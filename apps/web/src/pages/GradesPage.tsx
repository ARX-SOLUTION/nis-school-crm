import React, { useState } from 'react';
import type { GradeType } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { useStudentsQuery } from '@/features/students/api/use-students-query';
import { useSubjectsQuery } from '@/features/subjects/api/use-subjects-queries';
import {
  useGradesSummaryQuery,
  useRecordGradeMutation,
} from '@/features/grades/api/use-grades-queries';
import { GradesSheet } from '@/features/grades/components/GradesSheet';

export function GradesPage(): React.ReactElement {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const { data: classesData, isLoading: classesLoading } = useClassesQuery({
    page: 1,
    limit: 50,
  });

  const { data: subjectsData, isLoading: subjectsLoading } = useSubjectsQuery({
    isActive: true,
  });

  const classes = classesData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const activeClassId = selectedClassId || (classes.length > 0 ? classes[0].id : '');
  const activeSubjectId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : '');

  const { data: studentsData, isLoading: studentsLoading } = useStudentsQuery(
    { classId: activeClassId, limit: 100 },
    { enabled: Boolean(activeClassId) },
  );

  const { data: summaries = [], isLoading: summariesLoading } = useGradesSummaryQuery(
    activeClassId,
    activeSubjectId,
  );

  const recordGradeMutation = useRecordGradeMutation();

  const handleRecordGrade = async (payload: {
    studentId: string;
    classId: string;
    subjectId: string;
    date: string;
    score: number;
    gradeType: GradeType;
    comment?: string;
  }) => {
    await recordGradeMutation.mutateAsync(payload);
  };

  const students = studentsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Elektron Jurnal (Gradebook)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Dars baholari, sinf ishi, uy vazifasi va choraklik hisob-kitob jurnali.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="class-select" className="text-sm font-medium text-slate-700">
            Sinf:
          </label>
          <select
            id="class-select"
            value={activeClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classesLoading || classes.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
          <label htmlFor="subject-select" className="text-sm font-medium text-slate-700">
            Fan:
          </label>
          <select
            id="subject-select"
            value={activeSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={subjectsLoading || subjects.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {subjects.length === 0 ? (
              <option value="">Fanlar mavjud emas</option>
            ) : (
              subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))
            )}
          </select>
        </div>
      </Card>

      {/* Grade Sheet */}
      {classesLoading ||
      subjectsLoading ||
      (activeClassId && (studentsLoading || summariesLoading)) ? (
        <LoadingState label="Jurnal ma'lumotlari yuklanmoqda..." />
      ) : (
        <GradesSheet
          students={students}
          summaries={summaries}
          classId={activeClassId}
          subjectId={activeSubjectId}
          onRecordGrade={handleRecordGrade}
        />
      )}
    </div>
  );
}
