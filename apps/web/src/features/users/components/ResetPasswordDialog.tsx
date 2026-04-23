import { useEffect, useState } from 'react';
import type { UserResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { CopyableSecret } from '@/components/ui/CopyableSecret';
import { Dialog } from '@/components/ui/Dialog';
import { useResetPasswordMutation } from '../api/use-reset-password-mutation';

interface Props {
  open: boolean;
  user: UserResponseDto | null;
  onClose: () => void;
}

export function ResetPasswordDialog({ open, user, onClose }: Props): React.ReactElement {
  const mutation = useResetPasswordMutation();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  const resetMutation = mutation.reset;
  useEffect(() => {
    if (!open) {
      setGeneratedPassword(null);
      setNotified(false);
      resetMutation();
    }
  }, [open, resetMutation]);

  const run = async (): Promise<void> => {
    if (!user) return;
    try {
      const res = await mutation.mutateAsync(user.id);
      setGeneratedPassword(res.generatedPassword);
      setNotified(res.notified);
    } catch {
      // Surfaces via mutation.isError below; catch keeps the rejection handled.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reset password"
      description={user ? `Generate a new password for ${user.fullName}` : undefined}
    >
      {generatedPassword ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {notified
              ? 'Password generated. A Telegram message has been queued for this user.'
              : 'Password generated. The user has no linked Telegram account — deliver this manually.'}
          </p>
          <CopyableSecret value={generatedPassword} />
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            This will invalidate the user&apos;s current password and revoke all of their active
            sessions.
          </p>
          {mutation.isError ? (
            <p role="alert" className="text-sm text-red-600">
              {Array.isArray(mutation.error.message)
                ? mutation.error.message.join('; ')
                : mutation.error.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={run} isLoading={mutation.isPending}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
