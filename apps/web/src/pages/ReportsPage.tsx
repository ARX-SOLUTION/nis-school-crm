import React, { useState } from 'react';
import {
  useAttendanceReportQuery,
  useFinanceReportQuery,
  useGradesReportQuery,
} from '@/features/reports/api/use-reports-queries';
import { formatUzbekSum, formatCompactSum } from '@/lib/format-currency';

type Tab = 'attendance' | 'grades' | 'finance';

function formatMoney(amount: number): string {
  return formatCompactSum(amount);
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    violet: 'bg-violet-500',
  };
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-2 rounded-full ${colorMap[color] ?? 'bg-blue-500'} transition-all`}
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Oy:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{overallRate}%</p>
            <p className="text-xs text-slate-500">Umumiy davomat</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{data.length}</p>
            <p className="text-xs text-slate-500">Sinflar</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{totals.absent}</p>
            <p className="text-xs text-slate-500">Kelmagan</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-400">Yuklanmoqda...</div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-10 text-slate-400">Bu oyda ma'lumot yo'q</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Sinf</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-700">O'quvchilar</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-700 text-emerald-700">
                  Keldi
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-700 text-red-600">
                  Kelmadi
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-700 text-amber-600">
                  Kech
                </th>
                <th className="text-center px-3 py-3 font-semibold text-slate-700">Sababli</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Davomat %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const rateColor =
                  row.attendanceRate >= 90 ? 'green' : row.attendanceRate >= 75 ? 'amber' : 'red';
                const rateText =
                  row.attendanceRate >= 90
                    ? 'text-emerald-700'
                    : row.attendanceRate >= 75
                      ? 'text-amber-700'
                      : 'text-red-700';
                return (
                  <tr key={row.classId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.className}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{row.totalStudents}</td>
                    <td className="px-3 py-3 text-center font-medium text-emerald-700">
                      {row.presentCount}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-red-600">
                      {row.absentCount}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-amber-600">
                      {row.lateCount}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600">{row.excusedCount}</td>
                    <td className="px-4 py-3">
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
      {isLoading && <div className="flex justify-center py-10 text-slate-400">Yuklanmoqda...</div>}
      {!isLoading && (
        <>
          {/* Subject averages */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              Fanlar bo'yicha o'rtacha ball
            </h3>
            {subjects.length === 0 ? (
              <p className="text-slate-400 text-sm">Ma'lumot yo'q</p>
            ) : (
              <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Fan</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Sinf</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700">
                        Jami yozuv
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700">
                        O'tdi %
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-700">O'rtacha %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((s, i) => {
                      const color =
                        s.averageScore >= 75 ? 'green' : s.averageScore >= 50 ? 'amber' : 'red';
                      return (
                        <tr
                          key={`${s.subjectId}-${s.classId}-${i}`}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">{s.subjectName}</td>
                          <td className="px-4 py-3 text-slate-600">{s.className}</td>
                          <td className="px-3 py-3 text-center text-slate-600">
                            {s.totalRecorded}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                s.passingRate >= 75
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : s.passingRate >= 50
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {s.passingRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <ProgressBar value={s.averageScore} color={color} />
                              </div>
                              <span className="text-xs font-bold w-10 text-right text-slate-700">
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
            )}
          </div>

          {/* Top 10 students */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3">Top 10 o'quvchi</h3>
            {topStudents.length === 0 ? (
              <p className="text-slate-400 text-sm">Ma'lumot yo'q</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topStudents.map((s, idx) => (
                  <div
                    key={s.studentId}
                    className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm"
                  >
                    <span
                      className={`text-lg font-bold w-7 shrink-0 ${
                        idx === 0
                          ? 'text-amber-500'
                          : idx === 1
                            ? 'text-slate-500'
                            : idx === 2
                              ? 'text-amber-700'
                              : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{s.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {s.className ?? '-'} - {s.totalGrades} baho
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-blue-700">
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Davr:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            <option value={3}>3 oy</option>
            <option value={6}>6 oy</option>
            <option value={12}>12 oy</option>
          </select>
        </div>
        {data && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {formatMoney(data.totalCollectedPeriod)}
              </p>
              <p className="text-xs text-slate-500">Umumiy tushum</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatMoney(data.averageMonthlyRevenue)}
              </p>
              <p className="text-xs text-slate-500">Oylik o'rtacha</p>
            </div>
          </div>
        )}
      </div>

      {isLoading && <div className="flex justify-center py-10 text-slate-400">Yuklanmoqda...</div>}
      {!isLoading && data && (
        <>
          {/* Bar chart (CSS-based) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Oylik tushum dinamikasi</h3>
            <div className="flex items-end gap-2 h-36">
              {data.months.map((m) => {
                const heightPct = maxCollected > 0 ? (m.totalCollected / maxCollected) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-600 truncate w-full text-center">
                      {formatMoney(m.totalCollected)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-all"
                      style={{ height: `${Math.max(4, heightPct)}%`, minHeight: '4px' }}
                      title={`${m.month}: ${formatUzbekSum(m.totalCollected)}`}
                    />
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail table */}
          <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Oy</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">To'langan</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Kutilgan</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">
                    To'lovlar soni
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Yig'ish %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.months.map((m) => {
                  const rateColor =
                    m.collectionRate >= 90 ? 'green' : m.collectionRate >= 60 ? 'amber' : 'red';
                  const rateText =
                    m.collectionRate >= 90
                      ? 'text-emerald-700'
                      : m.collectionRate >= 60
                        ? 'text-amber-700'
                        : 'text-red-700';
                  return (
                    <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{m.month}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap font-medium text-emerald-700">
                        {formatUzbekSum(m.totalCollected)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-500">
                        {formatUzbekSum(m.totalExpected)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-600">
                        {m.paymentCount}
                      </td>
                      <td className="px-4 py-3">
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
        </>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'attendance', label: 'Davomat', icon: '📋' },
  { id: 'grades', label: 'Baholar', icon: '📊' },
  { id: 'finance', label: 'Moliya', icon: '💰' },
];

export function ReportsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hisobotlar va Tahlil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Davomat, baholar va moliyaviy ko'rsatkichlar bo'yicha to'liq hisobotlar
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
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
