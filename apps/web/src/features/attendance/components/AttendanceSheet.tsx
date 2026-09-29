import React, { useState, useEffect } from 'react';
import type { AttendanceStatus, BulkAttendanceItemDto, StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  students: StudentResponseDto[];
  existingRecords?: { studentId: string; status: AttendanceStatus; remarks?: string | null }[];
  date: string;
  onSave: (records: BulkAttendanceItemDto[]) => void;
  isSaving: boolean;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; activeClass: string; inactiveClass: string }
> = {
  PRESENT: {
    label: 'Bor',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs',
    inactiveClass: 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50',
  },
  LATE: {
    label: 'Kechikdi',
    activeClass: 'bg-amber-500 text-white border-amber-500 font-semibold shadow-xs',
    inactiveClass: 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50',
  },
  EXCUSED: {
    label: 'Sababli',
    activeClass: 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs',
    inactiveClass: 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50',
  },
  ABSENT: {
    label: "Yo'q",
    activeClass: 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs',
    inactiveClass: 'bg-white text-rose-700 border-slate-200 hover:bg-rose-50',
  },
};

const EMPTY_EXISTING_RECORDS: {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string | null;
}[] = [];

export function AttendanceSheet({
  students,
  existingRecords = EMPTY_EXISTING_RECORDS,
  date: _date,
  onSave,
  isSaving,
}: Props): React.ReactElement {
  const [records, setRecords] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    for (const student of students) {
      const match = existingRecords.find((r) => r.studentId === student.id);
      initial[student.id] = {
        status: match ? match.status : 'PRESENT',
        remarks: match?.remarks ?? '',
      };
    }
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    for (const student of students) {
      const match = existingRecords.find((r) => r.studentId === student.id);
      initial[student.id] = {
        status: match ? match.status : 'PRESENT',
        remarks: match?.remarks ?? '',
      };
    }
    setRecords(initial);
  }, [students, existingRecords]);

  if (students.length === 0) {
    return (
      <EmptyState
        title="O'quvchilar mavjud emas"
        description="Tanlangan sinfda faol o'quvchilar topilmadi."
      />
    );
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setRecords((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], status };
      }
      return next;
    });
  };

  const handleSave = () => {
    const payload: BulkAttendanceItemDto[] = Object.entries(records).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks.trim() ? data.remarks.trim() : undefined,
    }));
    onSave(payload);
  };

  // Stats calculation
  const total = students.length;
  let present = 0;
  let late = 0;
  let excused = 0;
  let absent = 0;

  for (const id of Object.keys(records)) {
    const s = records[id]?.status;
    if (s === 'PRESENT') present++;
    else if (s === 'LATE') late++;
    else if (s === 'EXCUSED') excused++;
    else if (s === 'ABSENT') absent++;
  }

  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Top action & metrics bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-medium text-slate-700">
            Jami: <span className="font-bold text-slate-900">{total}</span>
          </div>
          <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg font-medium">
            Bor: <span className="font-bold">{present}</span>
          </div>
          <div className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg font-medium">
            Kechikdi: <span className="font-bold">{late}</span>
          </div>
          <div className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg font-medium">
            Sababli: <span className="font-bold">{excused}</span>
          </div>
          <div className="bg-rose-50 text-rose-800 px-3 py-1.5 rounded-lg font-medium">
            Yo'q: <span className="font-bold">{absent}</span>
          </div>
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs">
            Davomat: {attendanceRate}%
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('PRESENT')}
            type="button"
          >
            Barchasini "Bor" qilish
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            type="button"
          >
            Davomatni saqlash
          </Button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <th scope="col" className="p-3.5 w-12 text-center">
                #
              </th>
              <th scope="col" className="p-3.5">
                O'quvchi
              </th>
              <th scope="col" className="p-3.5">
                Kodi
              </th>
              <th scope="col" className="p-3.5 text-center">
                Holati (Davomat)
              </th>
              <th scope="col" className="p-3.5">
                Izoh / Sabab
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const currentStatus = records[student.id]?.status ?? 'PRESENT';
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 text-center text-xs font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    {student.lastName} {student.firstName}
                  </td>
                  <td className="p-3.5 text-xs font-mono text-slate-500">{student.studentCode}</td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {(['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as AttendanceStatus[]).map(
                        (status) => {
                          const isSelected = currentStatus === status;
                          const cfg = STATUS_CONFIG[status];
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`min-h-[38px] px-3 py-1 rounded-lg text-xs border transition-all ${
                                isSelected ? cfg.activeClass : cfg.inactiveClass
                              }`}
                            >
                              {cfg.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      placeholder="Sabab yoki eslatma..."
                      value={records[student.id]?.remarks ?? ''}
                      onChange={(e) =>
                        setRecords((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            remarks: e.target.value,
                          },
                        }))
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
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
