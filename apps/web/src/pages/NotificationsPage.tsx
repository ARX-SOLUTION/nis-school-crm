import React, { useMemo, useState } from 'react';
import type { NotificationType, SendBroadcastRequestDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import {
  useNotificationLogsQuery,
  useSendBroadcastMutation,
} from '@/features/notifications/api/use-notifications-queries';
import { NotificationLogsTable } from '@/features/notifications/components/NotificationLogsTable';
import { SendBroadcastModal } from '@/features/notifications/components/SendBroadcastModal';

export function NotificationsPage(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | NotificationType>('ALL');

  const { data: logs = [], isLoading } = useNotificationLogsQuery(100);
  const broadcastMutation = useSendBroadcastMutation();

  const handleSendBroadcast = async (data: SendBroadcastRequestDto) => {
    await broadcastMutation.mutateAsync(data);
  };

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'ALL') return logs;
    return logs.filter((log) => log.type === activeFilter);
  }, [logs, activeFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const announcements = logs.filter((l) => l.type === 'ANNOUNCEMENT').length;
    const automated = logs.filter((l) => l.type !== 'ANNOUNCEMENT').length;
    const totalDelivered = logs.reduce((acc, curr) => acc + (curr.recipientCount || 0), 0);
    return { total, announcements, automated, totalDelivered };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xabarnomalar va Bildirishnomalar markazi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Telegram boti orqali avtomatik ogohlantirishlar va ommaviy xabarlar boshqaruvi
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="min-h-[44px] px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi xabar yuborish
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Jami yuborilgan
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Barcha xabarnomalar</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Ommaviy e'lonlar
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.announcements}</p>
          <p className="mt-1 text-xs text-slate-500">Admin va menejerlar xabarlari</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avtomat bildirishnomalar
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.automated}</p>
          <p className="mt-1 text-xs text-slate-500">Davomat, baholar va to'lovlar</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Yetkazilgan qabul qiluvchilar
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.totalDelivered}</p>
          <p className="mt-1 text-xs text-slate-500">Telegram bot orqali</p>
        </div>
      </div>

      {/* Filter Tabs & Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Barchasi ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ANNOUNCEMENT')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'ANNOUNCEMENT'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ommaviy e'lonlar
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ATTENDANCE')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'ATTENDANCE'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Davomat ogohlantirishlari
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('GRADE')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'GRADE'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Baholar
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PAYMENT')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === 'PAYMENT'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            To'lov kvitansiyalari
          </button>
        </div>

        <NotificationLogsTable logs={filteredLogs} isLoading={isLoading} />
      </div>

      <SendBroadcastModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSendBroadcast}
        isSubmitting={broadcastMutation.isPending}
      />
    </div>
  );
}

export default NotificationsPage;
