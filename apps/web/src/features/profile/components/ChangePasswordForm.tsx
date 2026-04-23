import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useChangePasswordMutation } from '../api/use-profile-mutations';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../schemas/change-password-schema';

export function ChangePasswordForm(): React.ReactElement {
  const mutation = useChangePasswordMutation();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);
    try {
      await mutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      reset();
      setDone(true);
    } catch {
      // mutation.isError drives the banner below
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div>
        <Label htmlFor="pw-old">Current password</Label>
        <Input
          id="pw-old"
          type="password"
          autoComplete="current-password"
          {...register('oldPassword')}
        />
        <FieldError>{errors.oldPassword?.message ?? null}</FieldError>
      </div>
      <div>
        <Label htmlFor="pw-new">New password</Label>
        <Input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
        />
        <FieldError>{errors.newPassword?.message ?? null}</FieldError>
      </div>
      <div>
        <Label htmlFor="pw-confirm">Confirm new password</Label>
        <Input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <FieldError>{errors.confirmPassword?.message ?? null}</FieldError>
      </div>

      {mutation.isError ? (
        <p role="alert" className="text-sm text-red-600">
          {Array.isArray(mutation.error.message)
            ? mutation.error.message.join('; ')
            : mutation.error.message}
        </p>
      ) : null}

      {done ? (
        <p role="status" className="text-sm text-green-700">
          Password changed. All other sessions have been revoked.
        </p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
        Update password
      </Button>
    </form>
  );
}
