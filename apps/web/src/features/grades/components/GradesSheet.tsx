import React, { useState } from 'react';
import type { GradeType, StudentGradeSummaryDto, StudentResponseDto } from '@nis/shared';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  students: StudentResponseDto[];
  summaries: StudentGradeSummaryDto[];
  classId: string;
  subjectId: string;
  onRecordGrade: (payload: {
    studentId: string;
    classId: string;
    subjectId: string;
    date: string;
    score: number;
    gradeType: GradeType;
    comment?: string;
  }) => Promise<void>;
}

export function GradesSheet({
  students,
  summaries,
  classId,
  subjectId,
  onRecordGrade,
}: Props): React.ReactElement {
  const [gradeType, setGradeType] = useState<GradeType>('CLASSWORK');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [todayDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (students.length === 0) {
    return (
      <EmptyState
        title="O'quvchilar mavjud emas"
        description="Tanlangan sinfda o'quvchilar topilmadi."
      />
    );
  }

  const handleQuickAdd = async (studentId: string, score: number) => {
    setIsSubmitting(true);
    try {
      await onRecordGrade({
        studentId,
        classId,
        subjectId,
        date: todayDate,
        score,
        gradeType,
        comment: comment.trim() ? comment.trim() : undefined,
      });
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Grade entry quick bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-tertiary">Dars turi:</label>
          {(['CLASSWORK', 'HOMEWORK', 'EXAM', 'QUARTER'] as GradeType[]).map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGradeType(gt)}
              className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                gradeType === gt
                  ? 'bg-primary text-tertiary shadow-xs'
                  : 'bg-muted-surface text-neutral-500 hover:bg-border'
              }`}
            >
              {gt === 'CLASSWORK'
                ? 'Sinf ishi'
                : gt === 'HOMEWORK'
                  ? 'Uyga vazifa'
                  : gt === 'EXAM'
                    ? 'Imtihon / Nazorat'
                    : 'Choraklik'}
            </button>
          ))}
        </div>

        <div className="text-xs text-neutral-500 font-medium">
          Sana: <span className="font-semibold text-tertiary">{todayDate}</span>
        </div>
      </div>

      {/* Gradebook Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-surface text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <th scope="col" className="p-3.5 w-12 text-center">
                #
              </th>
              <th scope="col" className="p-3.5">
                O'quvchi
              </th>
              <th scope="col" className="p-3.5">
                Oldingi baholari
              </th>
              <th scope="col" className="p-3.5 text-center">
                O'rtacha ball
              </th>
              <th scope="col" className="p-3.5 text-center">
                Baho qo'yish (1-click)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const summary = summaries.find((s) => s.studentId === student.id);
              const grades = summary?.grades ?? [];
              const avg = summary?.averageScore ?? 0;

              return (
                <tr key={student.id} className="hover:bg-muted-surface transition-colors">
                  <td className="p-3.5 text-center text-xs font-medium text-neutral-400">
                    {idx + 1}
                  </td>
                  <td className="p-3.5 font-semibold text-tertiary">
                    <div>
                      {student.lastName} {student.firstName}
                    </div>
                    <div className="text-xs font-mono text-neutral-400 font-normal">
                      {student.studentCode}
                    </div>
                  </td>
                  <td className="p-3.5">
                    {grades.length === 0 ? (
                      <span className="text-xs text-neutral-400 italic">Baholar mavjud emas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {grades.slice(-8).map((g) => (
                          <span
                            key={g.id}
                            title={`${g.date}: ${g.gradeType} ${g.comment ? `(${g.comment})` : ''}`}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${
                              g.score >= 4.5
                                ? 'bg-[#E8F7D0] text-success border-success'
                                : g.score >= 3.5
                                  ? 'bg-[#DBEAFE] text-secondary border-secondary/20'
                                  : g.score >= 2.5
                                    ? 'bg-muted-surface text-neutral-500 border-border'
                                    : 'bg-[#FEE2E2] text-error border-error'
                            }`}
                          >
                            {g.score}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        avg >= 4.5
                          ? 'bg-[#D9F2B3] text-success'
                          : avg >= 3.5
                            ? 'bg-[#DBEAFE] text-secondary'
                            : avg > 0
                              ? 'bg-amber-100 text-neutral-500'
                              : 'bg-muted-surface text-neutral-500'
                      }`}
                    >
                      {avg > 0 ? avg : '-'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {[5, 4, 3, 2].map((val) => (
                        <button
                          key={val}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleQuickAdd(student.id, val)}
                          className="min-h-[44px] w-9 h-9 rounded-lg font-bold text-sm bg-muted-surface text-tertiary hover:bg-primary hover:text-tertiary transition-all active:scale-95 disabled:opacity-50"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
