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
      <div aria-busy="true" aria-live="polite" className="p-6 text-sm text-slate-500">
        Loading users...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        No users match the current filters.
      </div>
    );
  }

  return (
    <div role="region" aria-label="Users" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
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
            <tr key={u.id} className="border-t border-slate-200">
              <Td>{u.fullName}</Td>
              <Td>{u.email}</Td>
              <Td>
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {u.role}
                </span>
              </Td>
              <Td>
                <span
                  className={
                    u.isActive
                      ? 'inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                      : 'inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600'
                  }
                >
                  {u.isActive ? 'Active' : 'Disabled'}
                </span>
              </Td>
              <Td>{u.telegramUsername ? `@${u.telegramUsername}` : '—'}</Td>
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
  <th className={`px-4 py-2 font-medium ${className ?? ''}`}>{children}</th>
);
const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>
);
