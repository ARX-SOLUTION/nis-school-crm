import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { loginSchema, type LoginFormValues } from '../schemas/login-schema';

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function LoginForm({
  onSubmit,
  isSubmitting,
  errorMessage,
}: LoginFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        <FieldError id="email-error">{errors.email?.message ?? null}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password) || undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        <FieldError id="password-error">{errors.password?.message ?? null}</FieldError>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
