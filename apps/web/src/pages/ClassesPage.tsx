import { useState } from 'react';
import type { ClassResponseDto, ClassesListQueryDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { useDeleteClassMutation } from '@/features/classes/api/use-delete-class-mutation';
import { ClassesTable } from '@/features/classes/components/ClassesTable';
import { CreateClassDialog } from '@/features/classes/components/CreateClassDialog';

export function ClassesPage(): React.ReactElement {
  const [query, setQuery] = useState<ClassesListQueryDto>({ page: 1, limit: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ClassResponseDto | null>(null);

  const { data, isLoading, error } = useClassesQuery(query);
  const deleteMutation = useDeleteClassMutation();

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id).catch(() => undefined);
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-slate-600">Manage class sections across academic years.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create class</Button>
      </div>

      <Card>
        {error ? (
          <div role="alert" className="p-6 text-sm text-red-600">
            Failed to load classes:{' '}
            {Array.isArray(error.message) ? error.message.join('; ') : error.message}
          </div>
        ) : (
          <ClassesTable
            data={data?.data ?? []}
            isLoading={isLoading}
            onDelete={(klass) => setDeleting(klass)}
          />
        )}

        {data ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              {data.meta.total === 0
                ? 'No results'
                : `Page ${data.meta.page} of ${data.meta.totalPages} (${data.meta.total} total)`}
            </span>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={data.meta.page <= 1}
                onClick={() => setQuery({ ...query, page: (query.page ?? 1) - 1 })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => setQuery({ ...query, page: (query.page ?? 1) + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <CreateClassDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete class"
        description={
          deleting
            ? `${deleting.name} (grade ${deleting.gradeLevel}, ${deleting.academicYear}) will be soft-deleted.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
