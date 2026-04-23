import { isAdminStats, type UserResponseDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { NewStudentsSparkline } from '@/features/dashboard/components/NewStudentsSparkline';
import { StatCard } from '@/features/dashboard/components/StatCard';
import {
  useDashboardStatsQuery,
  useRecentActivityQuery,
} from '@/features/dashboard/api/use-dashboard-queries';

export function DashboardPage({ user }: { user: UserResponseDto }): React.ReactElement {
  const statsQ = useDashboardStatsQuery();
  const canSeeActivity = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const activityQ = useRecentActivityQuery(canSeeActivity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Welcome back, {user.fullName}. Your role is <strong>{user.role}</strong>.
        </p>
      </div>

      {statsQ.error ? (
        <Card className="p-4 text-sm text-red-600" role="alert">
          Failed to load dashboard:{' '}
          {Array.isArray(statsQ.error.message)
            ? statsQ.error.message.join('; ')
            : statsQ.error.message}
        </Card>
      ) : null}

      {statsQ.data && isAdminStats(statsQ.data) ? (
        <>
          <section aria-labelledby="kpi-heading" className="space-y-3">
            <h2 id="kpi-heading" className="sr-only">
              Key metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Students — Active"
                value={statsQ.data.students.active}
                hint={`${statsQ.data.students.unassigned} unassigned`}
              />
              <StatCard label="Students — Archived" value={statsQ.data.students.archived} />
              <StatCard
                label="Classes"
                value={statsQ.data.classes.total}
                hint={`~${statsQ.data.classes.averageFillPercent}% average fill`}
              />
              <StatCard label="Teachers" value={statsQ.data.teachersCount} />
            </div>
          </section>

          <Card className="p-4">
            <h2 className="text-base font-medium">New students — last 7 days</h2>
            <div className="mt-3">
              <NewStudentsSparkline series={statsQ.data.newStudentsLast7Days} />
            </div>
          </Card>

          {canSeeActivity ? (
            <Card>
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-base font-medium">Recent activity</h2>
                <p className="text-xs text-slate-500">Last 10 audit entries.</p>
              </div>
              {activityQ.isLoading ? (
                <div className="p-6 text-sm text-slate-500" aria-busy="true">
                  Loading…
                </div>
              ) : !activityQ.data || activityQ.data.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No recent activity yet.</div>
              ) : (
                <ul className="divide-y divide-slate-200 text-sm">
                  {activityQ.data.map((row) => (
                    <li key={row.id} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <span className="font-medium text-slate-900">{row.action}</span>
                        {row.entityType ? (
                          <span className="ml-2 text-slate-500">{row.entityType}</span>
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
      ) : null}

      {statsQ.data && !isAdminStats(statsQ.data) ? (
        <Card className="p-4 space-y-1">
          <h2 className="text-base font-medium">My class</h2>
          {statsQ.data.myClass ? (
            <div className="text-sm text-slate-700 space-x-4">
              <span className="font-semibold">{statsQ.data.myClass.name}</span>
              <span>Grade {statsQ.data.myClass.gradeLevel}</span>
              <span>{statsQ.data.myClass.academicYear}</span>
              <span>
                {statsQ.data.myClass.studentCount} / {statsQ.data.myClass.maxStudents} students
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              You are not currently assigned as a class teacher.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
