import type { StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Props {
  data: StudentResponseDto[];
  isLoading?: boolean;
  onViewProfile?: (student: StudentResponseDto) => void;
  onAssignClass?: (student: StudentResponseDto) => void;
  onArchive?: (student: StudentResponseDto) => void;
}

export function StudentsTable({
  data,
  isLoading,
  onViewProfile,
  onAssignClass,
  onArchive,
}: Props): React.ReactElement {
  if (isLoading && data.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="p-6 text-sm text-neutral-500">
        Loading students...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-neutral-500">
        No students match the current filters.
      </div>
    );
  }

  return (
    <div role="region" aria-label="Students" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="text-left">
          <tr>
            <Th>Code</Th>
            <Th>Name</Th>
            <Th>Grade</Th>
            <Th>Status</Th>
            <Th>Class</Th>
            <Th>Parent</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr
              key={s.id}
              className="border-b border-border hover:bg-muted-surface transition-colors bg-surface"
            >
              <Td>
                <code className="text-xs text-neutral-500">{s.studentCode}</code>
              </Td>
              <Td>
                {onViewProfile ? (
                  <button
                    type="button"
                    onClick={() => onViewProfile(s)}
                    className="font-medium text-secondary hover:underline hover:underline text-left"
                    aria-label={`View profile of ${s.lastName} ${s.firstName}`}
                  >
                    {s.lastName} {s.firstName}
                  </button>
                ) : (
                  <span className="font-medium text-tertiary">
                    {s.lastName} {s.firstName}
                  </span>
                )}
                {s.middleName ? <span className="text-neutral-500"> {s.middleName}</span> : null}
              </Td>
              <Td>{s.gradeLevel}</Td>
              <Td>
                <StatusBadge status={s.status} />
              </Td>
              <Td>{s.classId ? 'Assigned' : <span className="text-neutral-400">None</span>}</Td>
              <Td>{s.parentFullName ?? '-'}</Td>
              <Td className="text-right whitespace-nowrap space-x-2">
                {onViewProfile ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewProfile(s)}
                    aria-label={`View profile for ${s.lastName} ${s.firstName}`}
                  >
                    Profil
                  </Button>
                ) : null}
                {onAssignClass && s.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onAssignClass(s)}
                    aria-label={`Assign class for ${s.lastName} ${s.firstName}`}
                  >
                    Assign class
                  </Button>
                ) : null}
                {onArchive && s.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onArchive(s)}
                    aria-label={`Archive ${s.lastName} ${s.firstName}`}
                  >
                    Archive
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

function StatusBadge({ status }: { status: StudentResponseDto['status'] }): React.ReactElement {
  if (status === 'ACTIVE') {
    return (
      <Badge variant="success" withDot>
        Active
      </Badge>
    );
  }
  if (status === 'INACTIVE') {
    return <Badge variant="neutral">Archived</Badge>;
  }
  return <Badge variant="info">Graduated</Badge>;
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
