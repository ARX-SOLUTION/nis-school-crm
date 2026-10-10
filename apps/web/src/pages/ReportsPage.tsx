import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  useAttendanceReportQuery,
  useFinanceReportQuery,
  useGradesReportQuery,
} from '@/features/reports/api/use-reports-queries';
import { formatUzbekSum, formatCompactSum } from '@/lib/format-currency';
import { ClipboardCheck, GraduationCap, CircleDollarSign } from 'lucide-react';

type Tab = 'attendance' | 'grades' | 'finance';

function formatMoney(amount: number): string {
  return formatCompactSum(amount);
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    violet: 'bg-violet-500',
  };
  return (
    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`h-2 rounded-full ${colorMap[color] ?? 'bg-blue-600'} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function AttendancePanel() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);

  const { data = [], isLoading } = useAttendanceReportQuery(month);

  const totals = data.reduce(
    (acc, r) => ({
      present: acc.present + r.presentCount,
      absent: acc.absent + r.absentCount,
      late: acc.late + r.lateCount,
      excused: acc.excused + r.excusedCount,
    }),
    { present: 0, absent: 0, late: 0, excused: 0 },
  );
  const totalRec = totals.present + totals.absent + totals.late + totals.excused;
  const overallRate =
    totalRec > 0
      ? Math.round(((totals.present + totals.late + totals.excused) / totalRec) * 100)
      : 100;

  return (
    <div className="space-y-5">
      {/* Month picker + summary */}
      <Card className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-400">Oy:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm bg-surface text-tertiary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-success">{overallRate}%</p>
            <p className="text-xs text-neutral-500">Umumiy davomat</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-tertiary">{data.length}</p>
            <p className="text-xs text-neutral-500">Sinflar</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-rose-400">{totals.absent}</p>
            <p className="text-xs text-neutral-500">Kelmagan</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-10 text-neutral-400">Yuklanmoqda...</div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-10 text-neutral-400">Bu oyda ma'lumot yo'q</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted-surface border-b border-border">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                    Sinf
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                    O'quvchilar
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary text-success">
                    Keldi
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary text-rose-400">
                    Kelmadi
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary text-neutral-400">
                    Kech
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                    Sababli
                  </th>
                  <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                    Davomat %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map((row) => {
                  const rateColor =
                    row.attendanceRate >= 90 ? 'green' : row.attendanceRate >= 75 ? 'amber' : 'red';
                  const rateText =
                    row.attendanceRate >= 90
                      ? 'text-success'
                      : row.attendanceRate >= 75
                        ? 'text-neutral-400'
                        : 'text-rose-400';
                  return (
                    <tr key={row.classId} className="hover:bg-muted-surface transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                        {row.className}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-neutral-400">
                        {row.totalStudents}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-medium text-success">
                        {row.presentCount}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-medium text-rose-400">
                        {row.absentCount}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-medium text-neutral-400">
                        {row.lateCount}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-neutral-400">
                        {row.excusedCount}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <ProgressBar value={row.attendanceRate} color={rateColor} />
                          </div>
                          <span className={`text-xs font-bold w-9 text-right ${rateText}`}>
                            {row.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function GradesPanel() {
  const { data, isLoading } = useGradesReportQuery();

  const subjects = data?.subjects ?? [];
  const topStudents = data?.topStudents ?? [];

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex justify-center py-10 text-neutral-400">Yuklanmoqda...</div>
      )}
      {!isLoading && (
        <>
          {/* Subject averages */}
          <div>
            <h3 className="text-base font-semibold text-tertiary mb-3">
              Fanlar bo'yicha o'rtacha ball
            </h3>
            {subjects.length === 0 ? (
              <p className="text-neutral-400 text-sm">Ma'lumot yo'q</p>
            ) : (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted-surface border-b border-border">
                      <tr>
                        <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          Fan
                        </th>
                        <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          Sinf
                        </th>
                        <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          Jami yozuv
                        </th>
                        <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          O'tdi %
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          O'rtacha %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {subjects.map((s, i) => {
                        const color =
                          s.averageScore >= 75 ? 'green' : s.averageScore >= 50 ? 'amber' : 'red';
                        return (
                          <tr
                            key={`${s.subjectId}-${s.classId}-${i}`}
                            className="hover:bg-muted-surface transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-tertiary">
                              {s.subjectName}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-neutral-400">
                              {s.className}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-neutral-400">
                              {s.totalRecorded}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                  s.passingRate >= 75
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : s.passingRate >= 50
                                      ? 'bg-muted-surface text-neutral-400 border-border'
                                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {s.passingRate}%
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <ProgressBar value={s.averageScore} color={color} />
                                </div>
                                <span className="text-xs font-bold w-10 text-right text-tertiary">
                                  {s.averageScore.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Top 10 students */}
          <div>
            <h3 className="text-base font-semibold text-tertiary mb-3">Top 10 o'quvchi</h3>
            {topStudents.length === 0 ? (
              <p className="text-neutral-400 text-sm">Ma'lumot yo'q</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topStudents.map((s, idx) => (
                  <div
                    key={s.studentId}
                    className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 shadow-sm"
                  >
                    <span
                      className={`text-lg font-bold w-7 shrink-0 ${
                        idx === 0
                          ? 'text-neutral-500'
                          : idx === 1
                            ? 'text-neutral-500'
                            : idx === 2
                              ? 'text-neutral-500'
                              : 'text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-tertiary truncate">{s.studentName}</p>
                      <p className="text-xs text-neutral-500">
                        {s.className ?? '-'} - {s.totalGrades} baho
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-secondary">
                        {s.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FinancePanel() {
  const [months, setMonths] = useState(6);
  const { data, isLoading } = useFinanceReportQuery(months);

  const maxCollected = Math.max(...(data?.months.map((m) => m.totalCollected) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Period selector + KPIs */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-400">Davr:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm bg-surface text-tertiary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          >
            <option value={3}>3 oy</option>
            <option value={6}>6 oy</option>
            <option value={12}>12 oy</option>
          </select>
        </div>
        {data && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {formatMoney(data.totalCollectedPeriod)}
              </p>
              <p className="text-xs text-neutral-500">Umumiy tushum</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {formatMoney(data.averageMonthlyRevenue)}
              </p>
              <p className="text-xs text-neutral-500">Oylik o'rtacha</p>
            </div>
          </div>
        )}
      </Card>

      {isLoading && (
        <div className="flex justify-center py-10 text-neutral-400">Yuklanmoqda...</div>
      )}
      {!isLoading && data && (
        <>
          {/* Bar chart (CSS-based) */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-tertiary mb-4">Oylik tushum dinamikasi</h3>
            <div className="flex items-end gap-2 h-36">
              {data.months.map((m) => {
                const heightPct = maxCollected > 0 ? (m.totalCollected / maxCollected) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs font-semibold text-neutral-400 truncate w-full text-center">
                      {formatMoney(m.totalCollected)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary hover:bg-primary-hover transition-all"
                      style={{ height: `${Math.max(4, heightPct)}%`, minHeight: '4px' }}
                      title={`${m.month}: ${formatUzbekSum(m.totalCollected)}`}
                    />
                    <span className="text-[10px] text-neutral-400 truncate w-full text-center">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Detail table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted-surface border-b border-border">
                  <tr>
                    <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                      Oy
                    </th>
                    <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                      To'langan
                    </th>
                    <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                      Kutilgan
                    </th>
                    <th className="text-center px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                      To'lovlar soni
                    </th>
                    <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                      Yig'ish %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.months.map((m) => {
                    const rateColor =
                      m.collectionRate >= 90 ? 'green' : m.collectionRate >= 60 ? 'amber' : 'red';
                    const rateText =
                      m.collectionRate >= 90
                        ? 'text-success'
                        : m.collectionRate >= 60
                          ? 'text-neutral-500'
                          : 'text-rose-400';
                    return (
                      <tr key={m.month} className="hover:bg-muted-surface transition-colors">
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-tertiary">
                          {m.month}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap font-medium text-success">
                          {formatUzbekSum(m.totalCollected)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap text-neutral-500">
                          {formatUzbekSum(m.totalExpected)}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-mono tabular-nums text-neutral-500">
                          {m.paymentCount}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <ProgressBar value={m.collectionRate} color={rateColor} />
                            </div>
                            <span
                              className={`text-xs font-mono tabular-nums font-bold w-9 text-right ${rateText}`}
                            >
                              {m.collectionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'attendance', label: 'Davomat', icon: ClipboardCheck },
  { id: 'grades', label: 'Baholar', icon: GraduationCap },
  { id: 'finance', label: 'Moliya', icon: CircleDollarSign },
];

export function ReportsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-tertiary">Hisobotlar va Tahlil</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Davomat, baholar va moliyaviy ko'rsatkichlar bo'yicha to'liq hisobotlar
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div>
        {activeTab === 'attendance' && <AttendancePanel />}
        {activeTab === 'grades' && <GradesPanel />}
        {activeTab === 'finance' && <FinancePanel />}
      </div>
    </div>
  );
}
