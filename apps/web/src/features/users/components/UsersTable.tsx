import type { UserResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  data: UserResponseDto[];
  isLoading?: boolean;
  onResetPassword?: (user: UserResponseDto) => void;
  onDelete?: (user: UserResponseDto) => void;
}

export function UsersTable({
  data,
  isLoading,
  onResetPassword,
  onDelete,
}: Props): React.ReactElement {
  if (isLoading && data.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="p-6 text-sm text-neutral-500">
        Loading users...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-neutral-500">
        No users match the current filters.
      </div>
    );
  }

  return (
    <div role="region" aria-label="Users" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="text-left">
          <tr>
            <Th>Full name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Telegram</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr
              key={u.id}
              className="border-b border-border hover:bg-muted-surface transition-colors bg-surface"
            >
              <Td>{u.fullName}</Td>
              <Td>{u.email}</Td>
              <Td>
                <span className="inline-block rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium">
                  {u.role}
                </span>
              </Td>
              <Td>
                <span
                  className={
                    u.isActive
                      ? 'inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                      : 'inline-block rounded-full bg-border px-2 py-0.5 text-xs font-medium text-neutral-500'
                  }
                >
                  {u.isActive ? 'Active' : 'Disabled'}
                </span>
              </Td>
              <Td>{u.telegramUsername ? `@${u.telegramUsername}` : '-'}</Td>
              <Td className="text-right space-x-2 whitespace-nowrap">
                {onResetPassword ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onResetPassword(u)}
                    aria-label={`Reset password for ${u.fullName}`}
                  >
                    Reset password
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(u)}
                    aria-label={`Delete ${u.fullName}`}
                  >
                    Delete
                  </Button>
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th
    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-muted-surface border-y border-border ${className ?? ''}`}
  >
    {children}
  </th>
);
const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-6 py-4 align-middle text-sm text-neutral-500 ${className ?? ''}`}>
    {children}
  </td>
);
