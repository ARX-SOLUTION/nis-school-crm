import React, { useState } from 'react';
import type { RoomResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDeleteRoomMutation } from '../api/use-rooms-queries';

interface Props {
  rooms: RoomResponseDto[];
  canManage: boolean;
  onOpenCreate?: () => void;
}

export function RoomsTable({ rooms, canManage, onOpenCreate }: Props): React.ReactElement {
  const [deleteTarget, setDeleteTarget] = useState<RoomResponseDto | null>(null);
  const deleteMutation = useDeleteRoomMutation();

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No rooms registered"
        description="Register classrooms, laboratories, and halls to enable timetable scheduling."
        actionLabel={canManage ? 'Add First Room' : undefined}
        onAction={canManage ? onOpenCreate : undefined}
      />
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Handled by deleteMutation.error
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Room
              </th>
              <th scope="col" className="px-4 py-3">
                Name / Purpose
              </th>
              <th scope="col" className="px-4 py-3">
                Type
              </th>
              <th scope="col" className="px-4 py-3">
                Capacity
              </th>
              <th scope="col" className="px-4 py-3">
                Floor
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              {canManage ? (
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.roomNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.name ?? 'Standard Classroom'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.capacity} seats</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.floor !== null ? `Floor ${r.floor}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      r.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canManage ? (
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(r)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete room"
          description={`Are you sure you want to delete ${deleteTarget.roomNumber}${deleteTarget.name ? ` (${deleteTarget.name})` : ''}? Historical schedule entries will be preserved.`}
          confirmLabel="Delete"
          isConfirming={deleteMutation.isPending}
        />
      ) : null}
    </>
  );
}
