import type { UserResponseDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm';
import { TelegramLinkCard } from '@/features/profile/components/TelegramLinkCard';

export function ProfilePage({ user }: { user: UserResponseDto }): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-600">Account details and security.</p>
      </div>

      <Card className="p-4 space-y-1">
        <h2 className="text-base font-medium">Account</h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-slate-500">Name</dt>
          <dd className="text-slate-900">{user.fullName}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd className="text-slate-900">{user.email}</dd>
          <dt className="text-slate-500">Role</dt>
          <dd className="text-slate-900">{user.role}</dd>
          <dt className="text-slate-500">Telegram</dt>
          <dd className="text-slate-900">
            {user.telegramUsername ? `@${user.telegramUsername}` : 'Not linked'}
          </dd>
        </dl>
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-medium mb-3">Change password</h2>
        <ChangePasswordForm />
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-medium mb-3">Telegram</h2>
        <TelegramLinkCard />
      </Card>
    </div>
  );
}
