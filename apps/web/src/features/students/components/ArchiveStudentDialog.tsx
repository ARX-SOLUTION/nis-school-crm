import { useEffect, useState } from 'react';
import type { StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useArchiveStudentMutation } from '../api/use-archive-student-mutation';

interface Props {
  open: boolean;
  student: StudentResponseDto | null;
  onClose: () => void;
}

export function ArchiveStudentDialog({ open, student, onClose }: Props): React.ReactElement {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const mutation = useArchiveStudentMutation();

  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
      mutation.reset();
    }
  }, [open, mutation.reset]);

  const submit = async (): Promise<void> => {
    setTouched(true);
    if (!student || reason.trim().length === 0) return;
    try {
      await mutation.mutateAsync({ id: student.id, body: { reason: reason.trim() } });
      onClose();
    } catch {
      /* error surfaces via mutation.isError */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Archive student"
      description={
        student ? `${student.lastName} ${student.firstName} will be marked inactive.` : undefined
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="archive-reason">Reason</Label>
          <Input
            id="archive-reason"
            placeholder="Oiladan ketdi, boshqa maktabga o'tdi, ..."
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={(touched && reason.trim().length === 0) || undefined}
          />
          <FieldError>
            {touched && reason.trim().length === 0 ? 'Reason is required' : null}
          </FieldError>
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
          <Button variant="destructive" onClick={submit} isLoading={mutation.isPending}>
            Archive
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
