import { useEffect, useMemo, useState } from 'react';
import type { ClassResponseDto, StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Label } from '@/components/ui/Label';
import { useAssignClassMutation } from '../api/use-assign-class-mutation';

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentResponseDto | null;
  classes: ClassResponseDto[];
}

export function AssignClassDialog({ open, onClose, student, classes }: Props): React.ReactElement {
  const [classId, setClassId] = useState('');
  const [reason, setReason] = useState('');
  const mutation = useAssignClassMutation(student?.id ?? '');

  // Only show classes that actually match the student's grade — the backend
  // will reject others, no reason to offer them.
  const options = useMemo(
    () => (student ? classes.filter((c) => c.isActive && c.gradeLevel === student.gradeLevel) : []),
    [classes, student],
  );

  useEffect(() => {
    if (!open) {
      setClassId('');
      setReason('');
      mutation.reset();
    }
    // mutation.reset is stable
  }, [open, mutation.reset]);

  const submit = async (): Promise<void> => {
    if (!classId) return;
    try {
      await mutation.mutateAsync({ classId, reason: reason || undefined });
      onClose();
    } catch {
      // surfaces via mutation.isError
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Assign to class"
      description={
        student
          ? `${student.lastName} ${student.firstName} · grade ${student.gradeLevel}`
          : undefined
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="assign-class-select">Class</Label>
          <select
            id="assign-class-select"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">— pick a class —</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.academicYear} ({c.maxStudents} cap)
              </option>
            ))}
          </select>
          <FieldError>
            {options.length === 0 ? 'No active classes match this grade level' : null}
          </FieldError>
        </div>

        <div>
          <Label htmlFor="assign-class-reason">Reason (optional)</Label>
          <input
            id="assign-class-reason"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            placeholder="parent request, mid-year transfer, ..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
          />
        </div>

        {mutation.isError ? (
          <p role="alert" className="text-sm text-red-600">
            {Array.isArray(mutation.error.message)
              ? mutation.error.message.join('; ')
              : mutation.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            isLoading={mutation.isPending}
            disabled={!classId || options.length === 0}
          >
            Assign
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
