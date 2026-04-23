import { useState } from 'react';
import type { RoleName, UserResponseDto, UsersListQueryDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUsersQuery } from '@/features/users/api/use-users-query';
import { useDeleteUserMutation } from '@/features/users/api/use-delete-user-mutation';
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog';
import { ResetPasswordDialog } from '@/features/users/components/ResetPasswordDialog';
import { UsersFilters } from '@/features/users/components/UsersFilters';
import { UsersTable } from '@/features/users/components/UsersTable';

interface Props {
  actorRole: RoleName;
}

export function UsersPage({ actorRole }: Props): React.ReactElement {
  const [query, setQuery] = useState<UsersListQueryDto>({ page: 1, limit: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [resetting, setResetting] = useState<UserResponseDto | null>(null);
  const [deleting, setDeleting] = useState<UserResponseDto | null>(null);

  const { data, isLoading, error } = useUsersQuery(query);
  const deleteMutation = useDeleteUserMutation();

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id).catch(() => undefined);
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-600">Manage admins, managers, and teachers.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create user</Button>
      </div>

      <Card className="p-4">
        <UsersFilters value={query} onChange={setQuery} />
      </Card>

      <Card>
        {error ? (
          <div role="alert" className="p-6 text-sm text-red-600">
            Failed to load users:{' '}
            {Array.isArray(error.message) ? error.message.join('; ') : error.message}
          </div>
        ) : (
          <UsersTable
            data={data?.data ?? []}
            isLoading={isLoading}
            onResetPassword={(user) => setResetting(user)}
            onDelete={(user) => setDeleting(user)}
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

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        actorRole={actorRole}
      />
      <ResetPasswordDialog
        open={resetting !== null}
        user={resetting}
        onClose={() => setResetting(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete user"
        description={
          deleting
            ? `${deleting.fullName} will be marked inactive and all sessions revoked. Soft delete — reversible by a super admin.`
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
