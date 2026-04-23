import { Link, useRouterState } from '@tanstack/react-router';
import type { UserResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { useLogoutMutation } from '@/features/auth/api/use-logout-mutation';

interface Props {
  user: UserResponseDto;
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
}

const MANAGER_PLUS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/classes', label: 'Classes' },
  { to: '/students', label: 'Students' },
  { to: '/profile', label: 'Profile' },
];

const TEACHER_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/my-class', label: 'My class' },
  { to: '/profile', label: 'Profile' },
];

export function AppShell({ user, children }: Props): React.ReactElement {
  const logout = useLogoutMutation();
  const state = useRouterState({ select: (s) => s.location.pathname });
  const nav = user.role === 'TEACHER' ? TEACHER_NAV : MANAGER_PLUS;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight text-slate-900">NIS School CRM</span>
            <nav aria-label="Primary" className="flex gap-4">
              {nav.map((item) => {
                const active = state === item.to || (item.to !== '/' && state.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={
                      active
                        ? 'text-sm font-medium text-blue-700'
                        : 'text-sm text-slate-600 hover:text-slate-900'
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              isLoading={logout.isPending}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
