import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ClassResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateStudentMutation } from '../api/use-create-student-mutation';
import {
  createStudentSchema,
  type CreateStudentFormValues,
} from '../schemas/create-student-schema';

interface Props {
  open: boolean;
  onClose: () => void;
  classes: ClassResponseDto[];
}

export function CreateStudentDialog({ open, onClose, classes }: Props): React.ReactElement {
  const mutation = useCreateStudentMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      birthDate: '',
      gender: undefined,
      gradeLevel: 1,
      classId: '',
      parentFullName: '',
      parentPhone: '',
      parentTelegram: '',
    },
  });

  const close = (): void => {
    reset();
    mutation.reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      close();
    } catch {
      // surfaces via mutation.isError
    }
  });

  return (
    <Dialog open={open} onClose={close} title="Create student" description="Register a new student">
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Last name" htmlFor="stu-last" error={errors.lastName?.message}>
            <Input id="stu-last" {...register('lastName')} />
          </Field>
          <Field label="First name" htmlFor="stu-first" error={errors.firstName?.message}>
            <Input id="stu-first" {...register('firstName')} />
          </Field>
        </div>
        <Field
          label="Middle name (optional)"
          htmlFor="stu-middle"
          error={errors.middleName?.message}
        >
          <Input id="stu-middle" {...register('middleName')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Birth date" htmlFor="stu-birth" error={errors.birthDate?.message}>
            <Input id="stu-birth" type="date" {...register('birthDate')} />
          </Field>
          <Field label="Grade level" htmlFor="stu-grade" error={errors.gradeLevel?.message}>
            <Input id="stu-grade" type="number" min={1} max={11} {...register('gradeLevel')} />
          </Field>
        </div>
        <Field label="Gender (optional)" htmlFor="stu-gender" error={errors.gender?.message}>
          <select
            id="stu-gender"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            {...register('gender')}
          >
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </Field>
        <Field label="Class (optional)" htmlFor="stu-class" error={errors.classId?.message}>
          <select
            id="stu-class"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            {...register('classId')}
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · grade {c.gradeLevel} · {c.academicYear}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Parent full name (optional)"
          htmlFor="stu-parent-name"
          error={errors.parentFullName?.message}
        >
          <Input id="stu-parent-name" {...register('parentFullName')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Parent phone"
            htmlFor="stu-parent-phone"
            error={errors.parentPhone?.message}
          >
            <Input id="stu-parent-phone" placeholder="+998901234567" {...register('parentPhone')} />
          </Field>
          <Field
            label="Parent Telegram"
            htmlFor="stu-parent-tg"
            error={errors.parentTelegram?.message}
          >
            <Input id="stu-parent-tg" placeholder="karimov_olim" {...register('parentTelegram')} />
          </Field>
        </div>

        {mutation.isError ? (
          <p role="alert" className="text-sm text-red-600">
            {Array.isArray(mutation.error.message)
              ? mutation.error.message.join('; ')
              : mutation.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            Create
          </Button>
        </div>
      </form>
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
