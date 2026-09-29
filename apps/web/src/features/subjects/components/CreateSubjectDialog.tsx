import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateSubjectMutation } from '../api/use-subjects-queries';

const createSubjectSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(16, 'Code cannot exceed 16 characters')
    .toUpperCase(),
  name: z.string().min(2, 'Subject name must be at least 2 characters'),
  gradeLevels: z
    .string()
    .min(1, 'Enter at least one grade level (e.g. 1, 2, 3, 4)')
    .transform((val) =>
      val
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 11),
    ),
  defaultHoursPerWeek: z.coerce.number().min(1).max(30).default(2),
});

type FormValues = z.input<typeof createSubjectSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateSubjectDialog({ open, onClose }: Props): React.ReactElement {
  const mutation = useCreateSubjectMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      code: '',
      name: '',
      gradeLevels: '1, 2, 3, 4, 5',
      defaultHoursPerWeek: 2,
    },
  });

  const close = () => {
    reset();
    mutation.reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = createSubjectSchema.parse(values);
      await mutation.mutateAsync({
        code: parsed.code,
        name: parsed.name,
        gradeLevels: parsed.gradeLevels,
        defaultHoursPerWeek: parsed.defaultHoursPerWeek,
      });
      close();
    } catch {
      // handled by mutation state
    }
  });

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Create Subject"
      description="Add a new academic subject to the curriculum"
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <Label htmlFor="subject-code">Subject Code</Label>
          <Input id="subject-code" placeholder="MATH" {...register('code')} />
          <FieldError message={errors.code?.message} />
        </div>

        <div>
          <Label htmlFor="subject-name">Subject Name</Label>
          <Input id="subject-name" placeholder="Mathematics" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="subject-grades">Applicable Grade Levels (comma separated)</Label>
          <Input id="subject-grades" placeholder="1, 2, 3, 4, 5" {...register('gradeLevels')} />
          <FieldError message={errors.gradeLevels?.message} />
        </div>

        <div>
          <Label htmlFor="subject-hours">Default Hours per Week</Label>
          <Input
            id="subject-hours"
            type="number"
            min={1}
            max={30}
            {...register('defaultHoursPerWeek')}
          />
          <FieldError message={errors.defaultHoursPerWeek?.message} />
        </div>

        {mutation.error ? (
          <p className="text-sm text-red-600">
            {Array.isArray(mutation.error) ? mutation.error.join('; ') : 'Failed to create subject'}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || mutation.isPending}>
            Save Subject
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
