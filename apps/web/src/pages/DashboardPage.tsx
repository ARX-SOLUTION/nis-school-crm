import React from 'react';
import { Link } from '@tanstack/react-router';
import { isAdminStats, type UserResponseDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { NewStudentsSparkline } from '@/features/dashboard/components/NewStudentsSparkline';
import { StatCard } from '@/features/dashboard/components/StatCard';
import {
  useDashboardStatsQuery,
  useRecentActivityQuery,
} from '@/features/dashboard/api/use-dashboard-queries';
import { useBillingStatsQuery } from '@/features/billing/api/use-billing-queries';
import { useLeadStatsQuery } from '@/features/leads/api/use-leads-queries';
import { formatCompactSum } from '@/lib/format-currency';

export function DashboardPage({ user }: { user: UserResponseDto }): React.ReactElement {
  const statsQ = useDashboardStatsQuery();
  const billingStatsQ = useBillingStatsQuery(undefined);
  const leadsStatsQ = useLeadStatsQuery();
  const canSeeActivity = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const activityQ = useRecentActivityQuery(canSeeActivity);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Welcome back, {user.fullName}. Signed in as{' '}
          <strong className="text-slate-800">{user.role}</strong>.
        </p>
      </div>

      {/* Tezkor amallar / Quick Actions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2 px-1">
          Tezkor amallar
        </span>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/attendance"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            Davomat olish
          </Link>
          <Link
            to="/grades"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            Elektron jurnal
          </Link>
          <Link
            to="/billing"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
            To'lovlar & Moliya
          </Link>
          <Link
            to="/leads"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
            Qabul voronkasi
          </Link>
          <Link
            to="/schedule"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
            Dars jadvali
          </Link>
          <Link
            to="/notifications"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
            Xabarnomalar
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm min-h-[44px]"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
            Tahlil & Hisobotlar
          </Link>
        </div>
      </div>

      {statsQ.isLoading ? (
        <LoadingState label="Loading dashboard metrics..." />
      ) : statsQ.error ? (
        <ErrorState
          title="Failed to load dashboard"
          message={statsQ.error.message}
          onRetry={() => statsQ.refetch()}
        />
      ) : statsQ.data && isAdminStats(statsQ.data) ? (
        <>
          <section aria-labelledby="kpi-heading" className="space-y-3">
            <h2 id="kpi-heading" className="sr-only">
              Key metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active students"
                value={statsQ.data.students.active}
                hint={`${statsQ.data.students.unassigned} unassigned`}
              />
              <StatCard
                label="Oylik tushum"
                value={
                  billingStatsQ.data
                    ? formatCompactSum(billingStatsQ.data.totalCollectedThisMonth)
                    : '...'
                }
                hint={
                  billingStatsQ.data ? `${billingStatsQ.data.debtorCount} nafar qarzdor` : undefined
                }
              />
              <StatCard
                label="Qabul voronkasi"
                value={leadsStatsQ.data ? leadsStatsQ.data.total : '...'}
                hint={
                  leadsStatsQ.data ? `${leadsStatsQ.data.conversionRate}% konversiya` : undefined
                }
              />
              <StatCard
                label="Total classes"
                value={statsQ.data.classes.total}
                hint={`~${statsQ.data.classes.averageFillPercent}% average fill`}
              />
            </div>
          </section>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">New students (last 7 days)</h2>
            <div className="mt-4">
              <NewStudentsSparkline series={statsQ.data.newStudentsLast7Days} />
            </div>
          </Card>

          {canSeeActivity ? (
            <Card>
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit log entries from recent administrative actions.
                </p>
              </div>
              {activityQ.isLoading ? (
                <LoadingState label="Loading recent audit activity..." />
              ) : !activityQ.data || activityQ.data.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No recent activity recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {activityQ.data.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{row.action}</span>
                        {row.entityType ? (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 font-mono">
                            {row.entityType}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(row.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </>
      ) : statsQ.data && !isAdminStats(statsQ.data) ? (
        <Card className="p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">My class overview</h2>
          {statsQ.data.myClass ? (
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="font-semibold text-blue-700 text-base">
                {statsQ.data.myClass.name}
              </span>
              <span className="text-slate-400">|</span>
              <span>Grade: {statsQ.data.myClass.gradeLevel}</span>
              <span className="text-slate-400">|</span>
              <span>Academic Year: {statsQ.data.myClass.academicYear}</span>
              <span className="text-slate-400">|</span>
              <span>
                Capacity: {statsQ.data.myClass.studentCount} / {statsQ.data.myClass.maxStudents}{' '}
                students
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              You are not currently assigned as a primary class teacher. Contact the school
              administrator to assign a class.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
