import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { attendanceApi } from '@/features/attendance/api/attendance-api';
import { gradesApi } from '@/features/grades/api/grades-api';
import { billingApi } from '@/features/billing/api/billing-api';
import { formatUzbekSum } from '@/lib/format-currency';

interface Props {
  open: boolean;
  student: StudentResponseDto | null;
  classNameLookup?: Record<string, string>;
  onClose: () => void;
  onAssignClass?: (student: StudentResponseDto) => void;
}

type Tab = 'overview' | 'attendance' | 'grades' | 'billing';

export function StudentProfileModal({
  open,
  student,
  classNameLookup,
  onClose,
  onAssignClass,
}: Props): React.ReactElement {
  const [tab, setTab] = useState<Tab>('overview');

  const attendanceQ = useQuery({
    queryKey: ['attendance', 'stats', student?.id],
    queryFn: () => attendanceApi.getStats(student!.id),
    enabled: open && !!student && tab === 'attendance',
  });

  const gradesQ = useQuery({
    queryKey: ['grades', 'student', student?.id],
    queryFn: () => gradesApi.list({ studentId: student!.id }),
    enabled: open && !!student && tab === 'grades',
  });

  const paymentsQ = useQuery({
    queryKey: ['billing', 'payments', student?.id],
    queryFn: () => billingApi.listPayments({ studentId: student!.id }),
    enabled: open && !!student && tab === 'billing',
  });

  if (!student) {
    return <></>;
  }

  const assignedClassName = student.classId
    ? (classNameLookup?.[student.classId] ?? `${student.gradeLevel}-sinf`)
    : 'Biriktirilmagan';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${student.lastName} ${student.firstName}`}
      description={`O'quvchi kodi: ${student.studentCode}`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'overview'}
            onClick={() => setTab('overview')}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium border-b-2 transition-colors ${
              tab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Umumiy
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'attendance'}
            onClick={() => setTab('attendance')}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium border-b-2 transition-colors ${
              tab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Davomat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'grades'}
            onClick={() => setTab('grades')}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium border-b-2 transition-colors ${
              tab === 'grades'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Baholar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'billing'}
            onClick={() => setTab('billing')}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium border-b-2 transition-colors ${
              tab === 'billing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            To'lovlar
          </button>
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-xs">Holati</span>
                <span className="font-medium text-slate-900">
                  {student.status === 'ACTIVE'
                    ? 'Faol'
                    : student.status === 'INACTIVE'
                      ? 'Arxivlangan'
                      : 'Bitirgan'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Sinfi</span>
                <span className="font-medium text-slate-900">{assignedClassName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Sinf darajasi</span>
                <span className="font-medium text-slate-900">{student.gradeLevel}-sinf</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Jinsi</span>
                <span className="font-medium text-slate-900">
                  {student.gender === 'MALE' ? "O'g'il bola" : 'Qiz bola'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Tug'ilgan sana</span>
                <span className="font-medium text-slate-900">
                  {student.birthDate ? new Date(student.birthDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Qabul qilingan sana</span>
                <span className="font-medium text-slate-900">
                  {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Ota-ona ma'lumotlari
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">F.I.O</span>
                  <span className="font-medium text-slate-900">
                    {student.parentFullName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Telefon raqam</span>
                  <span className="font-medium font-mono text-slate-900">
                    {student.parentPhone || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Telegram foydalanuvchi</span>
                  <span className="font-medium text-slate-900">
                    {student.parentTelegram ? `@${student.parentTelegram}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance */}
        {tab === 'attendance' && (
          <div className="space-y-4">
            {attendanceQ.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Davomat yuklanmoqda...</div>
            ) : attendanceQ.error ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                Davomat ko'rsatkichlarini yuklashda xatolik yuz berdi.
              </div>
            ) : attendanceQ.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-xs text-emerald-700 block">Qatnashish</span>
                    <span className="text-xl font-bold text-emerald-800">
                      {attendanceQ.data.ratePercentage}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-600 block">Jami darslar</span>
                    <span className="text-xl font-bold text-slate-800">
                      {attendanceQ.data.totalDays}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-xs text-red-700 block">Qoldirilgan</span>
                    <span className="text-xl font-bold text-red-800">
                      {attendanceQ.data.absentCount}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-xs text-amber-700 block">Kechikkan</span>
                    <span className="text-xl font-bold text-amber-800">
                      {attendanceQ.data.lateCount}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                Davomat yozuvlari topilmadi.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Grades */}
        {tab === 'grades' && (
          <div className="space-y-3">
            {gradesQ.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Baholar yuklanmoqda...</div>
            ) : gradesQ.error ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                Baholarni yuklashda xatolik yuz berdi.
              </div>
            ) : !gradesQ.data || gradesQ.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                O'quvchiga hali baho qo'yilmagan.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sana</th>
                      <th className="px-3 py-2">Tur</th>
                      <th className="px-3 py-2 text-center">Baho</th>
                      <th className="px-3 py-2">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradesQ.data.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{g.date}</td>
                        <td className="px-3 py-2 text-slate-800 font-mono text-xs">
                          {g.gradeType}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-blue-600">{g.score}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs truncate max-w-xs">
                          {g.comment || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Billing */}
        {tab === 'billing' && (
          <div className="space-y-3">
            {paymentsQ.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                To'lovlar tarixi yuklanmoqda...
              </div>
            ) : paymentsQ.error ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                To'lovlarni yuklashda xatolik yuz berdi.
              </div>
            ) : !paymentsQ.data || paymentsQ.data.data.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                To'lov yozuvlari topilmadi.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sana</th>
                      <th className="px-3 py-2">Summa</th>
                      <th className="px-3 py-2">Usul</th>
                      <th className="px-3 py-2">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsQ.data.data.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap font-semibold text-emerald-700">
                          {formatUzbekSum(Number(p.amount))}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-700">{p.method}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              p.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div>
            {onAssignClass && student.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onAssignClass(student);
                }}
              >
                Sinfga biriktirish
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Yopish
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
