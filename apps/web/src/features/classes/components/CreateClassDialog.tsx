import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateClassMutation } from '../api/use-create-class-mutation';
import { createClassSchema, type CreateClassFormValues } from '../schemas/create-class-schema';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateClassDialog({ open, onClose }: Props): React.ReactElement {
  const mutation = useCreateClassMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', gradeLevel: 1, academicYear: '', maxStudents: 30, roomNumber: '' },
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
      // error surfaces via mutation.isError below
    }
  });

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Create class"
      description="Add a class to the academic year"
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field label="Name" htmlFor="class-name" error={errors.name?.message}>
          <Input id="class-name" placeholder="4-A" {...register('name')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grade level" htmlFor="class-grade" error={errors.gradeLevel?.message}>
            <Input id="class-grade" type="number" min={1} max={11} {...register('gradeLevel')} />
          </Field>
          <Field label="Max students" htmlFor="class-max" error={errors.maxStudents?.message}>
            <Input id="class-max" type="number" min={1} max={60} {...register('maxStudents')} />
          </Field>
        </div>
        <Field label="Academic year" htmlFor="class-year" error={errors.academicYear?.message}>
          <Input id="class-year" placeholder="2026-2027" {...register('academicYear')} />
        </Field>
        <Field label="Room number" htmlFor="class-room" error={errors.roomNumber?.message}>
          <Input id="class-room" placeholder="201" {...register('roomNumber')} />
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
