import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyableSecret } from '@/components/ui/CopyableSecret';
import { useGenerateLinkCodeMutation } from '../api/use-profile-mutations';

export function TelegramLinkCard(): React.ReactElement {
  const mutation = useGenerateLinkCodeMutation();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const run = async (): Promise<void> => {
    try {
      const result = await mutation.mutateAsync();
      setCode(result.code);
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
    } catch {
      // surfaces via mutation.isError
    }
  };

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Link your Telegram account to receive notifications (new user passwords, password resets).
      </p>
      <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1">
        <li>Click the button below to generate a 6-digit code.</li>
        <li>
          Open the NIS bot on Telegram and send{' '}
          <code className="bg-slate-100 px-1 rounded">/link 123456</code> (with your code).
        </li>
      </ol>

      {code ? (
        <div className="space-y-2">
          <CopyableSecret value={code} />
          {secondsLeft !== null ? (
            <p className="text-xs text-slate-500">
              Expires in roughly {Math.max(0, Math.round(secondsLeft / 60))} minutes.
            </p>
          ) : null}
        </div>
      ) : null}

      {mutation.isError ? (
        <p role="alert" className="text-sm text-red-600">
          {Array.isArray(mutation.error.message)
            ? mutation.error.message.join('; ')
            : mutation.error.message}
        </p>
      ) : null}

      <Button variant={code ? 'outline' : 'primary'} onClick={run} isLoading={mutation.isPending}>
        {code ? 'Generate another' : 'Generate link code'}
      </Button>
    </div>
  );
}
