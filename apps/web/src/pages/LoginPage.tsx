import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useLoginMutation } from '@/features/auth/api/use-login-mutation';
import { Card } from '@/components/ui/Card';

export function LoginPage(): React.ReactElement {
  const mutation = useLoginMutation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-slate-50">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">NIS School CRM</p>
        <div className="mt-6">
          <LoginForm
            isSubmitting={mutation.isPending}
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
      </Card>
    </div>
  );
}
