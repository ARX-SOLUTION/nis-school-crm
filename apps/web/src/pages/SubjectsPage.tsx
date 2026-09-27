import React, { useState } from 'react';
import type { RoleName } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { Pagination } from '@/components/ui/Pagination';
import { useSubjectsQuery } from '@/features/subjects/api/use-subjects-queries';
import { CreateSubjectDialog } from '@/features/subjects/components/CreateSubjectDialog';
import { SubjectsTable } from '@/features/subjects/components/SubjectsTable';

interface Props {
  actorRole: RoleName;
}

export function SubjectsPage({ actorRole }: Props): React.ReactElement {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canManage = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN' || actorRole === 'MANAGER';
  const { data, isLoading, error, refetch } = useSubjectsQuery({
    search: search.trim() || undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Subjects</h1>
          <p className="text-sm text-slate-600 mt-1">
            Curriculum subjects, grade-level requirements, and weekly lesson allocations.
          </p>
        </div>
        {canManage ? (
          <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
            Add Subject
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading academic subjects..." />
      ) : error ? (
        <ErrorState
          title="Could not load subjects"
          message={error.message}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <SubjectsTable
            subjects={data?.data ?? []}
            canManage={canManage}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
          {data && data.meta ? (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={data.meta.limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      )}

      {isCreateOpen ? (
        <CreateSubjectDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      ) : null}
    </div>
  );
}
