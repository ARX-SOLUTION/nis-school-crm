import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useLoginMutation } from '@/features/auth/api/use-login-mutation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Default demo credentials configured for the environment
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'khkhamidullo@gmail.com';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'qwer12345!';

export function LoginPage(): React.ReactElement {
  const mutation = useLoginMutation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setServerError(null);
    setIsDemoLoading(true);
    try {
      await mutation.mutateAsync({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      await navigate({ to: '/' });
    } catch (err) {
      const apiErr = err as { message?: string | string[] };
      const msg = Array.isArray(apiErr.message)
        ? apiErr.message.join('; ')
        : (apiErr.message ?? 'Demo login failed');
      setServerError(msg);
    } finally {
      setIsDemoLoading(false);
    }
  };

  if (showForgot) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-muted-surface">
        <Card className="w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Reset Password</h1>
          <p className="mt-4 text-sm text-neutral-500">
            For security reasons, password resets are currently managed by school administrators.
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            Please contact your system administrator or HR department to receive a new password.
          </p>
          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => setShowForgot(false)}>
              Back to login
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const isPending = mutation.isPending || isDemoLoading;

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 bg-muted-surface">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">NIS School CRM</p>
        <div className="mt-6">
          <LoginForm
            isSubmitting={isPending}
            onForgotPassword={() => setShowForgot(true)}
            errorMessage={serverError}
            onSubmit={async (values) => {
              setServerError(null);
              try {
                await mutation.mutateAsync(values);
                await navigate({ to: '/' });
              } catch (err) {
                const apiErr = err as { message?: string | string[] };
                const msg = Array.isArray(apiErr.message)
                  ? apiErr.message.join('; ')
                  : (apiErr.message ?? 'Login failed');
                setServerError(msg);
              }
            }}
          />
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="relative flex justify-center text-xs uppercase tracking-wider text-neutral-400 mb-4">
            <span className="bg-surface px-2">Yoki</span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border hover:bg-muted-surface text-tertiary font-semibold flex items-center justify-center gap-2 group transition-all"
            isLoading={isDemoLoading}
            disabled={isPending}
            onClick={handleDemoLogin}
          >
            <span className="flex h-2 w-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
            <span>Roʻyxatdan oʻtmasdan demoga kiring</span>
          </Button>

          <p className="mt-2.5 text-center text-xs text-neutral-400">
            Barcha modullarni sinab koʻrish uchun tayyor demo hisob
          </p>
        </div>
      </Card>
    </main>
  );
}
