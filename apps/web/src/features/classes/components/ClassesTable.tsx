import type { ClassResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  data: ClassResponseDto[];
  isLoading?: boolean;
  onAssignTeacher?: (klass: ClassResponseDto) => void;
  onDelete?: (klass: ClassResponseDto) => void;
}

export function ClassesTable({
  data,
  isLoading,
  onAssignTeacher,
  onDelete,
}: Props): React.ReactElement {
  if (isLoading && data.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite" className="p-6 text-sm text-slate-500">
        Loading classes...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        No classes match the current filters.
      </div>
    );
  }

  return (
    <div role="region" aria-label="Classes" className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <Th>Name</Th>
            <Th>Grade</Th>
            <Th>Academic year</Th>
            <Th>Capacity</Th>
            <Th>Room</Th>
            <Th>Teacher</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t border-slate-200">
              <Td>
                <span className="font-medium text-slate-900">{c.name}</span>
              </Td>
              <Td>
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {c.gradeLevel}
                </span>
              </Td>
              <Td>{c.academicYear}</Td>
              <Td>{c.maxStudents}</Td>
              <Td>{c.roomNumber ?? '—'}</Td>
              <Td>
                {c.classTeacherId ? 'Assigned' : <span className="text-slate-400">None</span>}
              </Td>
              <Td className="text-right whitespace-nowrap space-x-2">
                {onAssignTeacher ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onAssignTeacher(c)}
                    aria-label={`Assign teacher to ${c.name}`}
                  >
                    Assign teacher
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(c)}
                    aria-label={`Delete class ${c.name}`}
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
