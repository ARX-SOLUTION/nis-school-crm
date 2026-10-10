import type { UserResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
              <Td className="font-semibold text-slate-100">{u.fullName}</Td>
              <Td className="text-slate-400">{u.email}</Td>
              <Td>
                <span className="inline-block rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 text-xs font-medium">
                  {u.role}
                </span>
              </Td>
              <Td>
                {u.isActive ? (
                  <Badge variant="success" withDot>
                    Active
                  </Badge>
                ) : (
                  <Badge variant="neutral">Disabled</Badge>
                )}
              </Td>
              <Td className="text-slate-400">
                {u.telegramUsername ? `@${u.telegramUsername}` : '-'}
              </Td>
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
    className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800 ${className ?? ''}`}
  >
    {children}
  </th>
);
const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td
    className={`px-3 sm:px-4 py-2.5 sm:py-3 align-middle text-sm text-slate-300 ${className ?? ''}`}
  >
    {children}
  </td>
);
