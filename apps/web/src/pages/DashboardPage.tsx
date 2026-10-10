import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MethodologyNote } from '@/components/ui/MethodologyNote';
import { NewStudentsSparkline } from '@/features/dashboard/components/NewStudentsSparkline';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { useDashboardStatsQuery } from '@/features/dashboard/api/use-dashboard-queries';
import { useLeadStatsQuery } from '@/features/leads/api/use-leads-queries';
import { useFinanceReportQuery } from '@/features/reports/api/use-reports-queries';
import { getTashkentGreeting } from '@/lib/tashkent-greeting';
import { formatCompactSum } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import {
  isAdminStats,
  type ClassFillBucketDto,
  type LeadStage,
  type UserResponseDto,
} from '@nis/shared';

interface DashboardPageProps {
  user: UserResponseDto;
}

export function DashboardPage({ user }: DashboardPageProps): React.ReactElement {
  const statsQ = useDashboardStatsQuery();

  const greeting = getTashkentGreeting();

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header section with compact enterprise hierarchy */}
      <header className="space-y-1 sm:space-y-1.5">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-tertiary">
          {greeting}, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-sm sm:text-base text-neutral-500">
          Maktab bo'yicha umumiy ko'rsatkichlar va tezkor holat.
        </p>
      </header>

      {/* Quick Actions (Bento Grid Style) */}
      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2.5 sm:mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <Link
            to="/attendance"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
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
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              Grades
            </span>
          </Link>

          <Link
            to="/billing"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              Billing
            </span>
          </Link>

          <Link
            to="/leads"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              CRM Pipeline
            </span>
          </Link>

          <Link
            to="/schedule"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              Schedule
            </span>
          </Link>

          <Link
            to="/reports"
            className="group flex flex-col justify-between p-4 bg-surface border border-border/80 rounded-xl hover:border-blue-500/50 hover:shadow-dark-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-[100px]"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/15 transition-colors flex items-center justify-center mb-4 border border-slate-700/60 group-hover:border-blue-500/30">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
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
        <div className="space-y-5 sm:space-y-6">
          {/* Band 0 — Alerts: Render ONLY when alerts && alerts.length > 0 */}
          {statsQ.data.alerts && statsQ.data.alerts.length > 0 ? (
            <section aria-label="Tezkor ogohlantirishlar" className="space-y-2.5">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                Diqqat talab holatlar ({statsQ.data.alerts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {statsQ.data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-xl border p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all shadow-dark-sm',
                      alert.level === 'critical'
                        ? 'border-red-500/30 bg-red-950/25 border-l-4 border-l-error'
                        : 'border-amber-500/30 bg-amber-950/25 border-l-4 border-l-amber-500',
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border',
                            alert.level === 'critical'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                          )}
                        >
                          {alert.level === 'critical' ? 'Kritik' : 'Ogohlantirish'}
                        </span>
                        <span className="font-semibold text-sm text-tertiary truncate">
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{alert.reason}</p>
                    </div>

                    <Link
                      to={alert.link}
                      className={cn(
                        'shrink-0 inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                        alert.level === 'critical'
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-amber-600 text-white hover:bg-amber-500',
                      )}
                    >
                      Ko‘rish &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Band 1 — Headline KPIs (4 StatCards) */}
          <section aria-labelledby="kpi-heading">
            <h2
              id="kpi-heading"
              className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2.5 sm:mb-3"
            >
              Asosiy ko‘rsatkichlar (KPIs)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Collection Rate */}
              <StatCard
                label="To'lovlar yig'ish darajasi"
                value={`${statsQ.data.collectionRateKpi?.current ?? 0}%`}
                target="Maqsad: 80%+"
                trend={{
                  value: `${
                    (statsQ.data.collectionRateKpi?.current ?? 0) -
                      (statsQ.data.collectionRateKpi?.sameDayLastMonth ?? 0) >=
                    0
                      ? `+${
                          Math.round(
                            ((statsQ.data.collectionRateKpi?.current ?? 0) -
                              (statsQ.data.collectionRateKpi?.sameDayLastMonth ?? 0)) *
                              10,
                          ) / 10
                        }`
                      : `${
                          Math.round(
                            ((statsQ.data.collectionRateKpi?.current ?? 0) -
                              (statsQ.data.collectionRateKpi?.sameDayLastMonth ?? 0)) *
                              10,
                          ) / 10
                        }`
                  }%`,
                  isPositive:
                    (statsQ.data.collectionRateKpi?.current ?? 0) >=
                    (statsQ.data.collectionRateKpi?.sameDayLastMonth ?? 0),
                  label: "vs o'tgan oy (shu kun)",
                }}
                tone={
                  statsQ.data.collectionRateKpi?.isCritical
                    ? 'critical'
                    : (statsQ.data.collectionRateKpi?.current ?? 0) < 80
                      ? 'warning'
                      : 'success'
                }
                link={{ href: '/billing', text: "To'lovlar bo'limi" }}
              />

              {/* 2. Total Arrears */}
              {(() => {
                const totalArrears = statsQ.data.arrearsKpi?.totalArrears ?? 0;
                const prevArrears = statsQ.data.arrearsKpi?.previousMonthTotalArrears ?? 0;
                const diff = totalArrears - prevArrears;
                return (
                  <StatCard
                    label="Umumiy qarzdorlik"
                    value={formatCompactSum(totalArrears)}
                    target="0 so'm"
                    trend={{
                      value: `${diff >= 0 ? '+' : '-'}${formatCompactSum(Math.abs(diff))}`,
                      isPositive: totalArrears <= prevArrears,
                      label: "o'tgan oyga nisbatan",
                    }}
                    tone={
                      (statsQ.data.arrearsKpi?.priorMonthGapsCount ?? 0) > 0
                        ? 'critical'
                        : totalArrears > 0
                          ? 'warning'
                          : 'success'
                    }
                    link={{ href: '/billing', text: "Qarzdorlar ro'yxati" }}
                  />
                );
              })()}

              {/* 3. Attendance Compliance */}
              <StatCard
                label="Davomat qamrovi"
                value={`${statsQ.data.compliance?.rate ?? 0}%`}
                target="Maqsad: 100%"
                trend={{
                  value: `${statsQ.data.compliance?.thirtyDayMeanRate ?? 0}%`,
                  label: "vs 30 kunlik o'rtacha",
                }}
                tone={
                  (statsQ.data.compliance?.rate ?? 0) < 90
                    ? 'critical'
                    : (statsQ.data.compliance?.rate ?? 0) < 100
                      ? 'warning'
                      : 'success'
                }
                link={{ href: '/attendance', text: 'Davomat jurnali' }}
              />

              {/* 4. Enrolled Students */}
              <StatCard
                label="Faol o'quvchilar"
                value={statsQ.data.students.active}
                hint={`${statsQ.data.students.unassigned} ta sinfsiz o'quvchi`}
                trend={{
                  value: `+${statsQ.data.newStudentsLast7Days.reduce(
                    (acc, d) => acc + d.count,
                    0,
                  )}`,
                  isPositive: true,
                  label: "so'nggi 7 kunda",
                }}
                link={{ href: '/students', text: "O'quvchilar ro'yxati" }}
              />
            </div>

            <MethodologyNote className="mt-4">
              <div className="space-y-1.5">
                <p>
                  <strong>To'lovlar yig'ish darajasi (Collection Rate):</strong> Oy boshidan bugungi
                  kungacha to'langan summa kutilgan oylik rejaga nisbati. Agar joriy ko'rsatkich 80%
                  dan past bo'lsa va o'tgan oyning aynan shu kuniga nisbatan 10 foiz punktidan ko'p
                  orqada qolsa, kritik holat (🔴) hisoblanadi.
                </p>
                <p>
                  <strong>Umumiy qarzdorlik (Total Arrears):</strong> Faol o'quvchilar bo'yicha har
                  bir oy uchun hisoblangan to'lov va tasdiqlangan to'lovlar o'rtasidagi ijobiy
                  farqlar (kamomadlar) yig'indisi. Agar o'tgan oylardan to'lanmagan qarz mavjud
                  bo'lsa, kritik holat (🔴) hisoblanadi.
                </p>
                <p>
                  <strong>Davomat qamrovi (Attendance Compliance):</strong> Kamida bitta faol
                  o'quvchiga ega bo'lgan faol sinflar orasida bugun davomati belgilangan sinflar
                  ulushi (Belgilangan sinflar ÷ Kutilgan sinflar × 100%). Qamrov 100% dan past
                  bo'lsa, ogohlantirish beriladi.
                </p>
                <p>
                  <strong>Faol o'quvchilar (Enrolled Students):</strong> Maktabda hozirda o'qiyotgan
                  faol o'quvchilar umumiy soni va sinfga biriktirilmagan o'quvchilar holati.
                </p>
              </div>
            </MethodologyNote>
          </section>

          {/* Band 2 — Trends and Breakdowns (Slice 7) */}
          <Band2Breakdowns distribution={statsQ.data.classes.distribution ?? []} />

          <section>
            <Card className="p-3.5 sm:p-5 lg:p-6 border-none shadow-sm rounded-xl bg-surface ring-1 ring-border">
              <h2 className="text-base sm:text-lg font-semibold text-tertiary mb-4 sm:mb-6">
                New Students (Last 7 Days)
              </h2>
              <div className="h-44 sm:h-48">
                <NewStudentsSparkline series={statsQ.data.newStudentsLast7Days} />
              </div>
            </Card>
          </section>
        </div>
      ) : statsQ.data && !isAdminStats(statsQ.data) ? (
        <div className="space-y-8">
          {statsQ.data.myClass ? (
            <>
              {/* Class Header / Supplementary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm bg-muted-surface p-6 rounded-xl border border-border shadow-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-secondary text-2xl tracking-tight">
                      {statsQ.data.myClass.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {statsQ.data.myClass.gradeLevel}-sinf
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    O'quv yili: {statsQ.data.myClass.academicYear} &bull; Sig'im:{' '}
                    {statsQ.data.myClass.studentCount} / {statsQ.data.myClass.maxStudents} o'quvchi
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/attendance"
                    className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-secondary text-white hover:bg-blue-700 min-h-[44px] transition-colors"
                  >
                    Davomat jurnali &rarr;
                  </Link>
                </div>
              </div>

              {/* 3 Actionable KPI Cards */}
              <section aria-labelledby="teacher-kpi-heading">
                <h2
                  id="teacher-kpi-heading"
                  className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4"
                >
                  Sinf ko'rsatkichlari (Actionable KPIs)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. Today's Attendance Status */}
                  <div className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between shadow-xs ring-1 ring-border">
                    <div>
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                        Bugungi davomat holati
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'w-3 h-3 rounded-full',
                            statsQ.data.attendance?.isMarkedToday
                              ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                              : 'bg-red-500 ring-4 ring-red-500/20',
                          )}
                        />
                        <span className="text-lg font-bold text-tertiary">
                          {statsQ.data.attendance?.isMarkedToday ? 'Belgilangan' : 'Belgilanmagan'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {statsQ.data.attendance?.isMarkedToday
                          ? "Bugun sinf davomati to'liq kiritilgan."
                          : 'Bugungi davomat hali kiritilmagan!'}
                      </p>
                    </div>

                    {!statsQ.data.attendance?.isMarkedToday ? (
                      <Link
                        to="/attendance"
                        className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-800 min-h-[44px] transition-colors"
                      >
                        Davomatni belgilash &rarr;
                      </Link>
                    ) : null}
                  </div>

                  {/* 2. Weekly Attendance Rate */}
                  <StatCard
                    label="Haftalik davomat"
                    value={`${statsQ.data.attendance?.weeklyAttendanceRate ?? 0}%`}
                    target="Maqsad: 100%"
                    tone={
                      (statsQ.data.attendance?.weeklyAttendanceRate ?? 0) < 90
                        ? 'critical'
                        : (statsQ.data.attendance?.weeklyAttendanceRate ?? 0) < 98
                          ? 'warning'
                          : 'success'
                    }
                    link={{ href: '/attendance', text: 'Davomat jurnali' }}
                  />

                  {/* 3. Class Arrears */}
                  <StatCard
                    label="Sinfdagi qarzdorlik"
                    value={`${statsQ.data.arrears?.debtorCount ?? 0} ta qarzdor`}
                    hint={formatCompactSum(statsQ.data.arrears?.totalArrears ?? 0)}
                    tone={(statsQ.data.arrears?.totalArrears ?? 0) > 0 ? 'warning' : 'success'}
                    link={{ href: '/billing', text: "Qarzdorlar ro'yxati" }}
                  />
                </div>
              </section>
            </>
          ) : (
            <Card className="p-8 border-none shadow-sm rounded-xl ring-1 ring-border bg-surface text-center space-y-3">
              <h2 className="text-xl font-semibold text-tertiary">Sinf biriktirilmagan</h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                Sizga hozirda asosiy rahbarlik sinfi biriktirilmagan. Sinf biriktirish uchun maktab
                ma'muriyatiga murojaat qiling.
              </p>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface Band2BreakdownsProps {
  distribution: ClassFillBucketDto[];
}

function Band2Breakdowns({ distribution }: Band2BreakdownsProps): React.ReactElement {
  const leadsStatsQ = useLeadStatsQuery();
  const financeQ = useFinanceReportQuery(6);

  const stages: { key: LeadStage; label: string; color: string }[] = [
    { key: 'NEW', label: 'Yangi', color: 'bg-blue-500' },
    { key: 'CONTACTED', label: "Bog'lanilgan", color: 'bg-sky-500' },
    { key: 'TRIAL_SCHEDULED', label: 'Sinov darsi', color: 'bg-indigo-500' },
    { key: 'CONTRACT_SENT', label: 'Shartnoma', color: 'bg-amber-500' },
    { key: 'ENROLLED', label: 'Qabul qilingan', color: 'bg-emerald-600' },
    { key: 'LOST', label: "Yo'qotilgan", color: 'bg-neutral-400' },
  ];

  const bucketColors: Record<
    ClassFillBucketDto['bucket'],
    { bg: string; text: string; badge: string }
  > = {
    '<50%': {
      bg: 'bg-red-500/10 border-red-500/25',
      text: 'text-red-400',
      badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    },
    '50-79%': {
      bg: 'bg-amber-500/10 border-amber-500/25',
      text: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    },
    '80-99%': {
      bg: 'bg-blue-500/10 border-blue-500/25',
      text: 'text-blue-400',
      badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    },
    '100%': {
      bg: 'bg-emerald-500/10 border-emerald-500/25',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    },
  };

  return (
    <section aria-labelledby="band2-heading" className="space-y-4 sm:space-y-5">
      <h2
        id="band2-heading"
        className="text-xs font-semibold text-neutral-400 uppercase tracking-widest"
      >
        Tahlillar va taqsimotlar (Band 2)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
        {/* 1. Leads Funnel by Stage */}
        <Card className="p-3.5 sm:p-5 lg:p-6 border-none shadow-sm rounded-xl bg-surface ring-1 ring-border flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-semibold text-tertiary">Lidlar voronkasi</h3>
              <p className="text-xs text-neutral-500">Bosqichlar bo'yicha taqsimot</p>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              Voronka &rarr;
            </Link>
          </div>

          {leadsStatsQ.isLoading ? (
            <LoadingState label="Lidlar statistikasi yuklanmoqda..." />
          ) : leadsStatsQ.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 bg-muted-surface p-2.5 rounded-lg border border-border/50">
                <span>
                  Konversiya:{' '}
                  <strong className="text-tertiary font-bold">
                    {leadsStatsQ.data.conversionRate}%
                  </strong>
                </span>
                <span>
                  Jami lidlar:{' '}
                  <strong className="text-tertiary font-bold">{leadsStatsQ.data.total}</strong>
                </span>
              </div>

              <div className="space-y-2.5">
                {stages.map((st) => {
                  const count = leadsStatsQ.data?.byStage[st.key] ?? 0;
                  const total = leadsStatsQ.data?.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={st.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-400 font-medium">{st.label}</span>
                        <span className="text-tertiary font-semibold">
                          {count} ta ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn('h-2 rounded-full transition-all duration-500', st.color)}
                          style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Lidlar ma'lumotlari mavjud emas.</p>
          )}
        </Card>

        {/* 2. Class Fill as a Distribution */}
        <Card className="p-3.5 sm:p-5 lg:p-6 border-none shadow-sm rounded-xl bg-surface ring-1 ring-border flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-semibold text-tertiary">Sinflar to'lish taqsimoti</h3>
              <p className="text-xs text-neutral-500">Sig'im ko'rsatkichiga ko'ra guruhlanish</p>
            </div>
            <Link to="/classes" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              Sinflar &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {distribution.map((item) => {
              const style = bucketColors[item.bucket] ?? {
                bg: 'bg-slate-800/40 border-slate-700/60',
                text: 'text-slate-300',
                badge: 'bg-slate-800 text-slate-300 border border-slate-700',
              };
              return (
                <div
                  key={item.bucket}
                  className={cn(
                    'p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between gap-2 shadow-2xs',
                    style.bg,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-bold uppercase tracking-wider', style.text)}>
                      {item.label}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', style.badge)}>
                      {item.count} ta
                    </span>
                  </div>
                  <div className="min-h-[24px]">
                    {item.classNames && item.classNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.classNames.map((cnName) => (
                          <span
                            key={cnName}
                            className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800/80 border border-slate-700/60 text-slate-200 shadow-2xs"
                          >
                            {cnName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400 italic">Sinf yo'q</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 3. 6-Month Revenue Trend */}
      <Card className="p-3.5 sm:p-5 lg:p-6 border-none shadow-sm rounded-xl bg-surface ring-1 ring-border space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-base font-semibold text-tertiary">
              Oylik tushum trendi (So'nggi 6 oy)
            </h3>
            <p className="text-xs text-neutral-500">Moliya tushumlari va yig'ish samaradorligi</p>
          </div>
          <Link to="/reports" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
            Moliya hisoboti &rarr;
          </Link>
        </div>

        {financeQ.isLoading ? (
          <LoadingState label="Tushumlar hisoboti yuklanmoqda..." />
        ) : financeQ.data && financeQ.data.months && financeQ.data.months.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {financeQ.data.months.map((m) => (
                <div
                  key={m.month}
                  className="p-3 bg-muted-surface/70 rounded-xl border border-border text-center space-y-1"
                >
                  <span className="text-xs font-semibold text-neutral-500 block">{m.month}</span>
                  <span className="text-sm font-bold text-tertiary block">
                    {formatCompactSum(m.totalCollected)}
                  </span>
                  <div className="pt-1">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-bold border',
                        m.collectionRate >= 80
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                      )}
                    >
                      {m.collectionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 pt-3 border-t border-border/60 gap-2">
              <span>
                Davr bo'yicha jami tushum:{' '}
                <strong className="text-tertiary font-bold">
                  {formatCompactSum(financeQ.data.totalCollectedPeriod)}
                </strong>
              </span>
              <span>
                O'rtacha oylik tushum:{' '}
                <strong className="text-tertiary font-bold">
                  {formatCompactSum(financeQ.data.averageMonthlyRevenue)}
                </strong>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">Oylik tushum ma'lumotlari mavjud emas.</p>
        )}
      </Card>
    </section>
  );
}
