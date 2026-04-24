import type { TelegramAuthRequestDto } from '@nis/shared';
import { Card } from '@/components/ui/Card';
import { TelegramLogin } from '../components/TelegramLoginButton';
import { useTelegramLogin } from '../hooks/useTelegramLogin';

export function TelegramLoginPage(): React.ReactElement {
  const login = useTelegramLogin();

  function handleAuth(payload: TelegramAuthRequestDto): void {
    login.mutate(payload);
  }

  const errorMessage = login.error
    ? Array.isArray(login.error.message)
      ? login.error.message.join('; ')
      : login.error.message
    : null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-slate-50">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in with Telegram</h1>
        <p className="mt-1 text-sm text-slate-600">NIS School CRM</p>
        <div className="mt-6">
          <TelegramLogin onAuth={handleAuth} />
        </div>
        {login.isPending ? (
          <p aria-busy="true" className="mt-4 text-sm text-slate-500 text-center">
            Verifying…
          </p>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
