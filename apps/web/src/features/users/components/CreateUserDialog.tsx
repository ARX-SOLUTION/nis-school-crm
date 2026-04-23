import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { RoleName } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { CopyableSecret } from '@/components/ui/CopyableSecret';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateUserMutation } from '../api/use-create-user-mutation';
import {
  SELECTABLE_ROLES,
  createUserSchema,
  type CreateUserFormValues,
} from '../schemas/create-user-schema';

interface Props {
  open: boolean;
  onClose: () => void;
  /** The caller's role — filters the role dropdown. UX ONLY; the backend
   *  is the authoritative source of RBAC enforcement. */
  actorRole: RoleName;
}

export function CreateUserDialog({ open, onClose, actorRole }: Props): React.ReactElement {
  const mutation = useCreateUserMutation();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', fullName: '', role: 'TEACHER', phone: '', telegramUsername: '' },
  });

  const allowedRoles = SELECTABLE_ROLES.filter((r) => canActorCreate(actorRole, r));

  const close = (): void => {
    reset();
    setGeneratedPassword(null);
    mutation.reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await mutation.mutateAsync(values);
      setGeneratedPassword(result.generatedPassword);
    } catch {
      // Error surfaces via mutation.isError / mutation.error in the banner
      // below; we catch here to keep the promise handled so browsers don't
      // fire an unhandledrejection event.
    }
  });

  return (
    <Dialog open={open} onClose={close} title="Create user" description="Provision a new account">
      {generatedPassword ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Account created. Deliver this temporary password to the user. They will be required to
            change it on first login.
          </p>
          <CopyableSecret value={generatedPassword} />
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field label="Email" error={errors.email?.message} htmlFor="create-user-email">
            <Input id="create-user-email" type="email" {...register('email')} />
          </Field>
          <Field label="Full name" error={errors.fullName?.message} htmlFor="create-user-name">
            <Input id="create-user-name" {...register('fullName')} />
          </Field>
          <Field label="Role" error={errors.role?.message} htmlFor="create-user-role">
            <select
              id="create-user-role"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              {...register('role')}
            >
              {allowedRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phone (optional)" error={errors.phone?.message} htmlFor="create-user-phone">
            <Input id="create-user-phone" placeholder="+998901234567" {...register('phone')} />
          </Field>
          <Field
            label="Telegram username (optional)"
            error={errors.telegramUsername?.message}
            htmlFor="create-user-telegram"
          >
            <Input
              id="create-user-telegram"
              placeholder="alivaliyev"
              {...register('telegramUsername')}
            />
          </Field>

          {mutation.isError ? (
            <p role="alert" className="text-sm text-red-600">
              {Array.isArray(mutation.error.message)
                ? mutation.error.message.join('; ')
                : mutation.error.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError id={`${htmlFor}-error`}>{error ?? null}</FieldError>
    </div>
  );
}

function canActorCreate(actor: RoleName, target: RoleName): boolean {
  if (actor === 'SUPER_ADMIN') return target !== 'SUPER_ADMIN';
  if (actor === 'ADMIN') return target === 'MANAGER' || target === 'TEACHER';
  if (actor === 'MANAGER') return target === 'TEACHER';
  return false;
}
