import React, { Suspense } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import {
  useCurrentUserQuery,
  useIsAuthenticated,
} from '@/features/auth/api/use-current-user-query';
const TelegramLoginPage = React.lazy(() =>
  import('@/features/telegram-auth/pages/TelegramLoginPage').then((m) => ({
    default: m.TelegramLoginPage,
  })),
);
const ParentInviteAcceptPage = React.lazy(() =>
  import('@/features/telegram-auth/pages/ParentInviteAcceptPage').then((m) => ({
    default: m.ParentInviteAcceptPage,
  })),
);
const AttendancePage = React.lazy(() =>
  import('@/pages/AttendancePage').then((m) => ({ default: m.AttendancePage })),
);
const BillingPage = React.lazy(() =>
  import('@/pages/BillingPage').then((m) => ({ default: m.BillingPage })),
);
const BranchesPage = React.lazy(() =>
  import('@/pages/BranchesPage').then((m) => ({ default: m.BranchesPage })),
);
const ClassesPage = React.lazy(() =>
  import('@/pages/ClassesPage').then((m) => ({ default: m.ClassesPage })),
);
const ClubsPage = React.lazy(() =>
  import('@/pages/ClubsPage').then((m) => ({ default: m.ClubsPage })),
);
const DashboardPage = React.lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const GradesPage = React.lazy(() =>
  import('@/pages/GradesPage').then((m) => ({ default: m.GradesPage })),
);
const LeadsPage = React.lazy(() =>
  import('@/pages/LeadsPage').then((m) => ({ default: m.LeadsPage })),
);
const LoginPage = React.lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const MyClassPage = React.lazy(() =>
  import('@/pages/MyClassPage').then((m) => ({ default: m.MyClassPage })),
);
const NotificationsPage = React.lazy(() =>
  import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ProfilePage = React.lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const ReportsPage = React.lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const RoomsPage = React.lazy(() =>
  import('@/pages/RoomsPage').then((m) => ({ default: m.RoomsPage })),
);
const SchedulePage = React.lazy(() =>
  import('@/pages/SchedulePage').then((m) => ({ default: m.SchedulePage })),
);
const StudentsPage = React.lazy(() =>
  import('@/pages/StudentsPage').then((m) => ({ default: m.StudentsPage })),
);
const SubjectsPage = React.lazy(() =>
  import('@/pages/SubjectsPage').then((m) => ({ default: m.SubjectsPage })),
);
const UsersPage = React.lazy(() =>
  import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })),
);
import { tokenStore } from '@/lib/token-store';
import { refreshSession } from '@/lib/session';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function SuspensedLoginPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <LoginPage {...props} />
      </Suspense>
    );
  },
});

const telegramLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login/telegram',
  component: function SuspensedTelegramLoginPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <TelegramLoginPage {...props} />
      </Suspense>
    );
  },
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invite/$token',
  component: function SuspensedParentInviteAcceptPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <ParentInviteAcceptPage {...props} />
      </Suspense>
    );
  },
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  // Authoritative gate: if we only have a refresh token (e.g., after a tab
  // reload cleared the in-memory access token), perform the refresh before
  // handing the user into the shell. A failed refresh lands on /login.
  beforeLoad: async () => {
    const snap = tokenStore.getSnapshot();
    if (snap.accessToken) return;
    if (snap.refreshToken) {
      const ok = await refreshSession();
      if (ok) return;
    }
    throw redirect({ to: '/login' });
  },
  component: AuthenticatedShell,
});

function AuthenticatedShell(): React.ReactElement {
  const authed = useIsAuthenticated();
  // After a successful login, useLoginMutation already seeds authKeys.me()
  // in the query cache, so the shell renders without a spinner flash.
  const me = useCurrentUserQuery();

  if (!authed) return <Navigate to="/login" />;
  if (me.isLoading || !me.data) {
    return (
      <div aria-busy="true" className="min-h-dvh grid place-items-center text-neutral-500">
        Loading…
      </div>
    );
  }
  return (
    <AppShell user={me.data}>
      <Outlet />
    </AppShell>
  );
}

const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/',
  component: DashboardRouteComponent,
});

function DashboardRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <DashboardPage user={me.data} />
    </Suspense>
  );
}

const usersRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/users',
  component: UsersRouteComponent,
});

function UsersRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <UsersPage actorRole={me.data.role} />
    </Suspense>
  );
}

const classesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/classes',
  component: ClassesRouteComponent,
});

function ClassesRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <ClassesPage />
    </Suspense>
  );
}

const studentsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/students',
  component: StudentsRouteComponent,
});

function StudentsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <StudentsPage isAdmin={me.data.role === 'ADMIN' || me.data.role === 'SUPER_ADMIN'} />
    </Suspense>
  );
}

const clubsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/clubs',
  component: function SuspensedClubsPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <ClubsPage {...props} />
      </Suspense>
    );
  },
});

const myClassRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/my-class',
  component: function SuspensedMyClassPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <MyClassPage {...props} />
      </Suspense>
    );
  },
});

const subjectsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/subjects',
  component: SubjectsRouteComponent,
});

function SubjectsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <SubjectsPage actorRole={me.data.role} />
    </Suspense>
  );
}

const roomsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/rooms',
  component: RoomsRouteComponent,
});

function RoomsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <RoomsPage actorRole={me.data.role} />
    </Suspense>
  );
}

const scheduleRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/schedule',
  component: ScheduleRouteComponent,
});

function ScheduleRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <SchedulePage actorRole={me.data.role} />
    </Suspense>
  );
}

const attendanceRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/attendance',
  component: function SuspensedAttendancePage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <AttendancePage {...props} />
      </Suspense>
    );
  },
});

const gradesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/grades',
  component: function SuspensedGradesPage(props: Record<string, unknown>) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center text-neutral-500">
            Loading...
          </div>
        }
      >
        <GradesPage {...props} />
      </Suspense>
    );
  },
});

const billingRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/billing',
  component: BillingRouteComponent,
});

function BillingRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <BillingPage />
    </Suspense>
  );
}

const leadsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/leads',
  component: LeadsRouteComponent,
});

function LeadsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <LeadsPage />
    </Suspense>
  );
}

const notificationsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/notifications',
  component: NotificationsRouteComponent,
});

function NotificationsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <NotificationsPage />
    </Suspense>
  );
}

const reportsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reports',
  component: ReportsRouteComponent,
});

function ReportsRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER') return <Navigate to="/my-class" />;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <ReportsPage />
    </Suspense>
  );
}

const profileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profile',
  component: ProfileRouteComponent,
});

function ProfileRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <ProfilePage user={me.data} />
    </Suspense>
  );
}

const branchesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/branches',
  component: BranchesRouteComponent,
});

function BranchesRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  if (me.data.role === 'TEACHER' || me.data.role === 'PARENT') {
    return <Navigate to="/" />;
  }
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading...</div>}>
      <BranchesPage />
    </Suspense>
  );
}

const routeTree = rootRoute.addChildren([
  loginRoute,
  telegramLoginRoute,
  inviteRoute,
  authLayoutRoute.addChildren([
    dashboardRoute,
    branchesRoute,
    usersRoute,
    classesRoute,
    studentsRoute,
    subjectsRoute,
    roomsRoute,
    scheduleRoute,
    attendanceRoute,
    gradesRoute,
    clubsRoute,
    billingRoute,
    leadsRoute,
    notificationsRoute,
    reportsRoute,
    myClassRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter(): React.ReactElement {
  return <RouterProvider router={router} />;
}
