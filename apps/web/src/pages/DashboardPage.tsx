import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { NewStudentsSparkline } from '@/features/dashboard/components/NewStudentsSparkline';
import { StatCard } from '@/features/dashboard/components/StatCard';
import {
  useDashboardStatsQuery,
  useRecentActivityQuery,
} from '@/features/dashboard/api/use-dashboard-queries';
import { formatCompactSum } from '@/lib/format-currency';
import type { UserResponseDto } from '@nis/shared';
import { useLeadStatsQuery } from '@/features/leads/api/use-leads-queries';
import { useBillingStatsQuery } from '@/features/billing/api/use-billing-queries';

interface DashboardPageProps {
  user: UserResponseDto;
}

interface AdminStats {
  students: { active: number; unassigned: number };
  classes: { total: number; averageFillPercent: number };
  newStudentsLast7Days: Array<{ date: string; count: number }>;
}

function isAdminStats(data: unknown): data is AdminStats {
  return (data as AdminStats).students !== undefined;
}

export function DashboardPage({ user }: DashboardPageProps): React.ReactElement {
  const statsQ = useDashboardStatsQuery();

  const billingStatsQ = useBillingStatsQuery();
  const leadsStatsQ = useLeadStatsQuery();

  const canSeeActivity = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

  const activityQ = useRecentActivityQuery(canSeeActivity);

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8">
      {/* Header section with generous whitespace and large typography */}
      <header className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter text-tertiary">
          Good afternoon, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-lg text-neutral-500">Here is what's happening at NIS Tashkent today.</p>
      </header>

      {/* Quick Actions (Bento Grid Style) */}
      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link
            to="/attendance"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              Attendance
            </span>
          </Link>

          <Link
            to="/grades"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              Grades
            </span>
          </Link>

          <Link
            to="/billing"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              Billing
            </span>
          </Link>

          <Link
            to="/leads"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              CRM Pipeline
            </span>
          </Link>

          <Link
            to="/schedule"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              Schedule
            </span>
          </Link>

          <Link
            to="/reports"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/60 rounded-xl hover:border-primary hover:shadow-sm transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-muted-surface text-neutral-500 group-hover:text-success group-hover:bg-[#E8F7D0] transition-colors flex items-center justify-center mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-tertiary group-hover:text-tertiary">
              Reports
            </span>
          </Link>
        </div>
      </section>

      {/* Main Stats */}
      {statsQ.isLoading ? (
        <LoadingState label="Loading dashboard metrics..." />
      ) : statsQ.error ? (
        <ErrorState
          title="Failed to load dashboard"
          message={statsQ.error.message}
          onRetry={() => statsQ.refetch()}
        />
      ) : statsQ.data && isAdminStats(statsQ.data) ? (
        <div className="space-y-8">
          <section aria-labelledby="kpi-heading">
            <h2
              id="kpi-heading"
              className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4"
            >
              Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active Students"
                value={statsQ.data.students.active}
                hint={`${statsQ.data.students.unassigned} unassigned`}
              />
              <StatCard
                label="Monthly Revenue"
                value={
                  billingStatsQ.data
                    ? formatCompactSum(billingStatsQ.data.totalCollectedThisMonth)
                    : '...'
                }
                hint={billingStatsQ.data ? `${billingStatsQ.data.debtorCount} debtors` : undefined}
              />
              <StatCard
                label="Lead Pipeline"
                value={leadsStatsQ.data ? leadsStatsQ.data.total : '...'}
                hint={
                  leadsStatsQ.data ? `${leadsStatsQ.data.conversionRate}% conversion` : undefined
                }
              />
              <StatCard
                label="Total Classes"
                value={statsQ.data.classes.total}
                hint={`~${statsQ.data.classes.averageFillPercent}% average fill`}
              />
            </div>
          </section>

          <section>
            <Card className="p-6 border-none shadow-sm rounded-xl bg-surface ring-1 ring-border">
              <h2 className="text-lg font-semibold text-tertiary mb-6">
                New Students (Last 7 Days)
              </h2>
              <div className="h-48">
                <NewStudentsSparkline series={statsQ.data.newStudentsLast7Days} />
              </div>
            </Card>
          </section>

          {canSeeActivity ? (
            <section>
              <Card className="border-none shadow-sm rounded-xl bg-surface ring-1 ring-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-muted-surface/50">
                  <h2 className="text-lg font-semibold text-tertiary">Recent Activity</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Audit log entries from recent administrative actions.
                  </p>
                </div>
                {activityQ.isLoading ? (
                  <LoadingState label="Loading recent audit activity..." />
                ) : !activityQ.data || activityQ.data.length === 0 ? (
                  <div className="p-12 text-center text-sm text-neutral-500">
                    No recent activity recorded yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {activityQ.data.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted-surface/80 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-4" />
                          <span className="font-medium text-tertiary">{row.action}</span>
                          {row.entityType ? (
                            <span className="ml-3 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-lg bg-muted-surface text-neutral-500">
                              {row.entityType}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-neutral-400 font-medium tracking-wide">
                          {new Date(row.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          ) : null}
        </div>
      ) : statsQ.data && !isAdminStats(statsQ.data) ? (
        <Card className="p-8 border-none shadow-sm rounded-xl ring-1 ring-border bg-surface">
          <h2 className="text-xl font-semibold text-tertiary mb-6">My Class Overview</h2>
          {statsQ.data.myClass ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-sm text-neutral-500 bg-muted-surface p-6 rounded-xl border border-border">
              <span className="font-bold text-secondary text-2xl tracking-tight">
                {statsQ.data.myClass.name}
              </span>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Grade
                  </span>
                  <span className="font-medium text-tertiary">
                    {statsQ.data.myClass.gradeLevel}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Year
                  </span>
                  <span className="font-medium text-tertiary">
                    {statsQ.data.myClass.academicYear}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Capacity
                  </span>
                  <span className="font-medium text-tertiary">
                    {statsQ.data.myClass.studentCount} / {statsQ.data.myClass.maxStudents}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-base text-neutral-500 leading-relaxed">
              You are not currently assigned as a primary class teacher. Contact the school
              administrator to assign a class.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
