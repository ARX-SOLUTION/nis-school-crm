import { useState } from 'react';
import type { StudentResponseDto, StudentStatus, StudentsListQueryDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { useStudentsQuery } from '@/features/students/api/use-students-query';
import { studentsApi } from '@/features/students/api/students-api';
import { ArchiveStudentDialog } from '@/features/students/components/ArchiveStudentDialog';
import { AssignClassDialog } from '@/features/students/components/AssignClassDialog';
import { CreateStudentDialog } from '@/features/students/components/CreateStudentDialog';
import { StudentsTable } from '@/features/students/components/StudentsTable';

interface Props {
  isAdmin: boolean;
}

const STATUSES: StudentStatus[] = ['ACTIVE', 'INACTIVE', 'GRADUATED'];

export function StudentsPage({ isAdmin }: Props): React.ReactElement {
  const [query, setQuery] = useState<StudentsListQueryDto>({ page: 1, limit: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState<StudentResponseDto | null>(null);
  const [archiving, setArchiving] = useState<StudentResponseDto | null>(null);

  const { data, isLoading, error } = useStudentsQuery(query);
  const classesQ = useClassesQuery({ page: 1, limit: 100 });
  const classes = classesQ.data?.data ?? [];

  const downloadCsv = async (): Promise<void> => {
    const blob = await studentsApi.exportCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-slate-600">Enrolment, class assignment, and archive.</p>
        </div>
        <div className="space-x-2">
          {isAdmin ? (
            <Button variant="outline" onClick={downloadCsv}>
              Export CSV
            </Button>
          ) : null}
          <Button onClick={() => setCreateOpen(true)}>Create student</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <Label htmlFor="students-search">Search</Label>
            <Input
              id="students-search"
              placeholder="Name or student code"
              defaultValue={query.search ?? ''}
              onChange={(e) =>
                setQuery((q) => ({ ...q, search: e.target.value || undefined, page: 1 }))
              }
            />
          </div>
          <div>
            <Label htmlFor="students-grade">Grade</Label>
            <select
              id="students-grade"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={query.gradeLevel ?? ''}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  gradeLevel: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="students-status">Status</Label>
            <select
              id="students-status"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={query.status ?? ''}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  status: (e.target.value || undefined) as StudentStatus | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {error ? (
          <div role="alert" className="p-6 text-sm text-red-600">
            Failed to load students:{' '}
            {Array.isArray(error.message) ? error.message.join('; ') : error.message}
          </div>
        ) : (
          <StudentsTable
            data={data?.data ?? []}
            isLoading={isLoading}
            onAssignClass={(s) => setAssigning(s)}
            onArchive={(s) => setArchiving(s)}
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
                onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <CreateStudentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        classes={classes}
      />
      <AssignClassDialog
        open={assigning !== null}
        student={assigning}
        classes={classes}
        onClose={() => setAssigning(null)}
      />
      <ArchiveStudentDialog
        open={archiving !== null}
        student={archiving}
        onClose={() => setArchiving(null)}
      />
    </div>
  );
}
