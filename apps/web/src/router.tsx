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
import { ClassesPage } from '@/pages/ClassesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MyClassPage } from '@/pages/MyClassPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { UsersPage } from '@/pages/UsersPage';
import { tokenStore } from '@/lib/token-store';
import { refreshSession } from '@/lib/session';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
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

const myClassRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/my-class',
  component: MyClassPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authLayoutRoute.addChildren([
    dashboardRoute,
    usersRoute,
    classesRoute,
    studentsRoute,
    myClassRoute,
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
