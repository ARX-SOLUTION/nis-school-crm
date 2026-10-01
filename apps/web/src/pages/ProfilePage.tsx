import type { UserResponseDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm';
import { TelegramLinkCard } from '@/features/profile/components/TelegramLinkCard';

export function ProfilePage({ user }: { user: UserResponseDto }): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-neutral-500">Account details and security.</p>
      </div>

      <Card className="p-4 space-y-1">
        <h2 className="text-base font-medium">Account</h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-neutral-500">Name</dt>
          <dd className="text-tertiary">{user.fullName}</dd>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-tertiary">{user.email}</dd>
          <dt className="text-neutral-500">Role</dt>
          <dd className="text-tertiary">{user.role}</dd>
          <dt className="text-neutral-500">Telegram</dt>
          <dd className="text-tertiary">
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

      <Card className="p-4">
        <h2 className="text-base font-medium mb-3">Notification Preferences</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Current preferences: {JSON.stringify(user.notificationPrefs || {})}
        </p>
        {/* ponytail: skipped rich UI for prefs. Use PATCH /api/v1/auth/me/prefs manually or add a generic form when real toggles are defined. */}
      </Card>
    </div>
  );
}
