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
import { TelegramLoginPage } from '@/features/telegram-auth/pages/TelegramLoginPage';
import { ParentInviteAcceptPage } from '@/features/telegram-auth/pages/ParentInviteAcceptPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { BillingPage } from '@/pages/BillingPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { ClubsPage } from '@/pages/ClubsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GradesPage } from '@/pages/GradesPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { LoginPage } from '@/pages/LoginPage';
import { MyClassPage } from '@/pages/MyClassPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RoomsPage } from '@/pages/RoomsPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { StudentsPage } from '@/pages/StudentsPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { UsersPage } from '@/pages/UsersPage';
import { tokenStore } from '@/lib/token-store';
import { refreshSession } from '@/lib/session';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const telegramLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login/telegram',
  component: TelegramLoginPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invite/$token',
  component: ParentInviteAcceptPage,
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
      <div aria-busy="true" className="min-h-dvh grid place-items-center text-slate-500">
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
  return <DashboardPage user={me.data} />;
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
  return <UsersPage actorRole={me.data.role} />;
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
  return <ClassesPage />;
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
  return <StudentsPage isAdmin={me.data.role === 'ADMIN' || me.data.role === 'SUPER_ADMIN'} />;
}

const clubsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/clubs',
  component: ClubsPage,
});

const myClassRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/my-class',
  component: MyClassPage,
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
  return <SubjectsPage actorRole={me.data.role} />;
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
  return <RoomsPage actorRole={me.data.role} />;
}

const scheduleRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/schedule',
  component: ScheduleRouteComponent,
});

function ScheduleRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  return <SchedulePage actorRole={me.data.role} />;
}

const attendanceRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/attendance',
  component: AttendancePage,
});

const gradesRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/grades',
  component: GradesPage,
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
  return <BillingPage />;
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
  return <LeadsPage />;
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
  return <NotificationsPage />;
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
  return <ReportsPage />;
}

const profileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profile',
  component: ProfileRouteComponent,
});

function ProfileRouteComponent(): React.ReactElement | null {
  const me = useCurrentUserQuery();
  if (!me.data) return null;
  return <ProfilePage user={me.data} />;
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
  return <BranchesPage />;
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
