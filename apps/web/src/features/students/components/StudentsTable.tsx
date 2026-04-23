import type { StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  data: StudentResponseDto[];
  isLoading?: boolean;
  onAssignClass?: (student: StudentResponseDto) => void;
  onArchive?: (student: StudentResponseDto) => void;
}

export function StudentsTable({
  data,
  isLoading,
  onAssignClass,
  onArchive,
}: Props): React.ReactElement {
  if (isLoading && data.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="p-6 text-sm text-slate-500">
        Loading students...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        No students match the current filters.
      </div>
    );
  }

  return (
    <div role="region" aria-label="Students" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
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
            <tr key={s.id} className="border-t border-slate-200">
              <Td>
                <code className="text-xs text-slate-600">{s.studentCode}</code>
              </Td>
              <Td>
                <span className="font-medium text-slate-900">
                  {s.lastName} {s.firstName}
                </span>
                {s.middleName ? <span className="text-slate-500"> {s.middleName}</span> : null}
              </Td>
              <Td>{s.gradeLevel}</Td>
              <Td>
                <StatusBadge status={s.status} />
              </Td>
              <Td>{s.classId ? 'Assigned' : <span className="text-slate-400">None</span>}</Td>
              <Td>{s.parentFullName ?? '—'}</Td>
              <Td className="text-right whitespace-nowrap space-x-2">
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
  const label = status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Archived' : 'Graduated';
  const cls =
    status === 'ACTIVE'
      ? 'bg-green-50 text-green-700'
      : status === 'INACTIVE'
        ? 'bg-slate-200 text-slate-600'
        : 'bg-blue-50 text-blue-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-2 font-medium ${className ?? ''}`}>{children}</th>
);
const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>
);
