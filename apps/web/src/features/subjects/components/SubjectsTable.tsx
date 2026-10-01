import React, { useState } from 'react';
import type { SubjectResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDeleteSubjectMutation } from '../api/use-subjects-queries';

interface Props {
  subjects: SubjectResponseDto[];
  canManage: boolean;
  onOpenCreate?: () => void;
}

export function SubjectsTable({ subjects, canManage, onOpenCreate }: Props): React.ReactElement {
  const [deleteTarget, setDeleteTarget] = useState<SubjectResponseDto | null>(null);
  const deleteMutation = useDeleteSubjectMutation();

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects found"
        description="Get started by adding academic subjects to the school curriculum."
        actionLabel={canManage ? 'Add First Subject' : undefined}
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
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm text-tertiary">
          <thead className="border-b border-border bg-muted-surface text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Code
              </th>
              <th scope="col" className="px-4 py-3">
                Subject Name
              </th>
              <th scope="col" className="px-4 py-3">
                Grades
              </th>
              <th scope="col" className="px-4 py-3">
                Hours / Week
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
            {subjects.map((s) => (
              <tr key={s.id} className="hover:bg-muted-surface transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-tertiary">{s.code}</td>
                <td className="px-4 py-3 font-medium text-tertiary">{s.name}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {s.gradeLevels && s.gradeLevels.length > 0
                    ? s.gradeLevels.sort((a, b) => a - b).join(', ')
                    : 'All'}
                </td>
                <td className="px-4 py-3 text-neutral-500">{s.defaultHoursPerWeek} hrs</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      s.isActive
                        ? 'bg-[#E8F7D0] text-success border border-success'
                        : 'bg-muted-surface text-neutral-500 border border-border'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canManage ? (
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(s)}
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
          title="Delete subject"
          description={`Are you sure you want to remove ${deleteTarget.name} (${deleteTarget.code})? Existing historical grades will remain intact.`}
          confirmLabel="Delete"
          isConfirming={deleteMutation.isPending}
        />
      ) : null}
    </>
  );
}
