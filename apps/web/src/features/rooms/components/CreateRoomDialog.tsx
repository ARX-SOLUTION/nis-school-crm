import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROOM_TYPES, type RoomType } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateRoomMutation } from '../api/use-rooms-queries';

const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').max(32),
  name: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(500).default(30),
  type: z.enum(ROOM_TYPES).default('CLASSROOM'),
  floor: z.coerce.number().min(-2).max(20).optional(),
});

type FormValues = z.input<typeof createRoomSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ open, onClose }: Props): React.ReactElement {
  const mutation = useCreateRoomMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomNumber: '',
      name: '',
      capacity: 30,
      type: 'CLASSROOM',
      floor: 1,
    },
  });

  const close = () => {
    reset();
    mutation.reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = createRoomSchema.parse(values);
      await mutation.mutateAsync({
        roomNumber: parsed.roomNumber,
        name: parsed.name || undefined,
        capacity: parsed.capacity,
        type: parsed.type as RoomType,
        floor: parsed.floor !== undefined ? parsed.floor : undefined,
      });
      close();
    } catch {
      // handled by mutation.error
    }
  });

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Create Room"
      description="Register a classroom, laboratory, or facility for class scheduling"
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <Label htmlFor="room-number">Room Number / Identifier</Label>
          <Input id="room-number" placeholder="Room 204" {...register('roomNumber')} />
          <FieldError message={errors.roomNumber?.message} />
        </div>

        <div>
          <Label htmlFor="room-name">Display Name (optional)</Label>
          <Input id="room-name" placeholder="Advanced Chemistry Lab" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="room-type">Room Type</Label>
            <select
              id="room-type"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              {...register('type')}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="room-capacity">Student Capacity</Label>
            <Input id="room-capacity" type="number" min={1} max={500} {...register('capacity')} />
            <FieldError message={errors.capacity?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="room-floor">Floor Number</Label>
          <Input id="room-floor" type="number" min={-2} max={20} {...register('floor')} />
          <FieldError message={errors.floor?.message} />
        </div>

        {mutation.error ? (
          <p className="text-sm text-red-600">
            {Array.isArray(mutation.error) ? mutation.error.join('; ') : 'Failed to create room'}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || mutation.isPending}>
            Save Room
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
