import { useParams } from '@tanstack/react-router';
import type { TelegramAuthRequestDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { TelegramLogin } from '../components/TelegramLoginButton';
import { useAcceptParentInvite } from '../hooks/useAcceptParentInvite';

export function ParentInviteAcceptPage(): React.ReactElement {
  // strict: false lets the page component remain decoupled from route wiring.
  // The inviteRoute definition guarantees $token is always present.
  const { token } = useParams({ strict: false }) as { token: string };
  const accept = useAcceptParentInvite();

  function handleAuth(telegramAuthData: TelegramAuthRequestDto): void {
    accept.mutate({ inviteToken: token, telegramAuthData });
  }

  const errorMessage = accept.error
    ? Array.isArray(accept.error.message)
      ? accept.error.message.join('; ')
      : accept.error.message
    : null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-slate-50">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Accept parent invite</h1>
        <p className="mt-1 text-sm text-slate-600">
          Authenticate with Telegram to link your account to a student profile.
        </p>
        <div className="mt-6">
          <TelegramLogin onAuth={handleAuth} />
        </div>
        {accept.isPending ? (
          <p aria-busy="true" className="mt-4 text-sm text-slate-500 text-center">
            Verifying invite…
          </p>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {errorMessage === 'Invite token not found or already used'
              ? 'This invite link is no longer valid. Please ask staff to send a new one.'
              : errorMessage}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
