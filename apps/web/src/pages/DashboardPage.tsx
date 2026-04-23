import type { UserResponseDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';

export function DashboardPage({ user }: { user: UserResponseDto }): React.ReactElement {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-slate-600">
        Welcome back, {user.fullName}. Your role is <strong>{user.role}</strong>.
      </p>
      <Card className="p-6">
        <h2 className="text-base font-medium">Stats coming soon</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dashboard widgets will land in BOSQICH 7 once students, classes, and audit log are in
          place.
        </p>
      </Card>
    </div>
  );
}
