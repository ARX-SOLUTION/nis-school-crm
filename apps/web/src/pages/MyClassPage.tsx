import { Card } from '@/components/ui/Card';
import {
  useMyClassQuery,
  useMyStudentsQuery,
} from '@/features/teacher-self/api/use-teacher-self-queries';
import { StudentsTable } from '@/features/students/components/StudentsTable';

export function MyClassPage(): React.ReactElement {
  const klass = useMyClassQuery();
  const students = useMyStudentsQuery();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My class</h1>
        <p className="text-sm text-slate-600">Read-only view of the class you teach.</p>
      </div>

      <Card className="p-4">
        {klass.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : klass.data ? (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-slate-500">Name: </span>
              <span className="font-medium">{klass.data.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Grade: </span>
              {klass.data.gradeLevel}
            </div>
            <div>
              <span className="text-slate-500">Academic year: </span>
              {klass.data.academicYear}
            </div>
            <div>
              <span className="text-slate-500">Room: </span>
              {klass.data.roomNumber ?? '—'}
            </div>
            <div>
              <span className="text-slate-500">Capacity: </span>
              {klass.data.maxStudents}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            You are not currently assigned as a class teacher. Ask an administrator if this is
            unexpected.
          </p>
        )}
      </Card>

      <Card>
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold">Students</h2>
          <p className="text-xs text-slate-500">
            Read-only roster. Contact an administrator to make changes.
          </p>
        </div>
        {students.error ? (
          <div role="alert" className="p-6 text-sm text-red-600">
            Failed to load students:{' '}
            {Array.isArray(students.error.message)
              ? students.error.message.join('; ')
              : students.error.message}
          </div>
        ) : (
          <StudentsTable data={students.data ?? []} isLoading={students.isLoading} />
        )}
      </Card>
    </div>
  );
}
