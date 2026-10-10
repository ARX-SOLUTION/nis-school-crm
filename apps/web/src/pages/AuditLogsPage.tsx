import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Pagination } from '@/components/ui/Pagination';
import { useAuditLogsQuery } from '@/features/audit/api/use-audit-logs-query';

const AUDIT_ACTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
];

const ENTITY_TYPES = [
  { value: '', label: 'Barchasi' },
  { value: 'Student', label: 'Student' },
  { value: 'Class', label: 'Class' },
  { value: 'Payment', label: 'Payment' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Lead', label: 'Lead' },
  { value: 'User', label: 'User' },
];

function CopyableId({ id, label }: { id: string; label: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 max-w-full">
      <span title={id} className="truncate max-w-[100px] sm:max-w-[120px] inline-block font-mono">
        {id}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${label} nusxalash: ${id}`}
        title={copied ? 'Nusxalandi!' : 'Nusxalash'}
        className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-muted-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function AuditLogsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useAuditLogsQuery({
    page,
    limit,
    action: actionFilter.trim() || undefined,
    entityType: entityFilter.trim() || undefined,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  const formatTimestamp = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('uz-UZ', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-border pb-3 sm:pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tertiary">Audit loglar</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tizimdagi barcha ma'muriy amallar, o'zgarishlar va xavfsizlik hodisalari jurnali.
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="audit-action-filter"
              className="block text-xs font-semibold text-tertiary mb-1"
            >
              Amal bo‘yicha filtr
            </label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-slate-700 p-2.5 min-h-[44px] text-slate-200 bg-slate-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus:border-blue-500"
            >
              {AUDIT_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-entity-filter"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Ob'ekt turi bo‘yicha filtr
            </label>
            <select
              id="audit-entity-filter"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm rounded-md border border-slate-700 p-2.5 min-h-[44px] text-slate-200 bg-slate-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus:border-blue-500"
            >
              {ENTITY_TYPES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState label="Audit loglari yuklanmoqda..." />
      ) : isError ? (
        <ErrorState
          title="Xatolik yuz berdi"
          message={error?.message || 'Audit loglarini yuklashda xatolik yuz berdi'}
          onRetry={() => refetch()}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Hech qanday audit log topilmadi"
          description="Kiritilgan parametrlar bo'yicha amallar jurnali bo'sh yoki hali hech qanday amal bajarilmagan."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    Vaqt (Toshkent)
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    Foydalanuvchi ID
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    Amal
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    Ob'ekt turi
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    Ob'ekt ID
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                    IP manzil
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-slate-200">
                      {log.userId ? (
                        <CopyableId id={log.userId} label="Foydalanuvchi ID" />
                      ) : (
                        <span className="text-slate-500">Tizim / Anonim</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-slate-300 font-medium">
                      {log.entityType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                          {log.entityType}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-neutral-500">
                      {log.entityId ? (
                        <CopyableId id={log.entityId} label="Ob'ekt ID" />
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-neutral-500 whitespace-nowrap">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.total > 0 ? (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          ) : null}
        </Card>
      )}
    </div>
  );
}
