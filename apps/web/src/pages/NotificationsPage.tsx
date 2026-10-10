import React, { useMemo, useState } from 'react';
import type { NotificationType, SendBroadcastRequestDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
          <h1 className="text-2xl font-bold tracking-tight text-tertiary">
            Xabarnomalar va Bildirishnomalar markazi
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Telegram boti orqali avtomatik ogohlantirishlar va ommaviy xabarlar boshqaruvi
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="min-h-[44px] px-4 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi xabar yuborish
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card variant="metric" className="p-3.5 sm:p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Jami yuborilgan
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-100">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">Barcha xabarnomalar</p>
        </Card>
        <Card variant="metric" className="p-3.5 sm:p-4 border-blue-500/20 bg-blue-950/10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Ommaviy e'lonlar
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-blue-400">{stats.announcements}</p>
          <p className="mt-1 text-xs text-slate-400">Admin va menejerlar xabarlari</p>
        </Card>
        <Card variant="metric" className="p-3.5 sm:p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avtomat bildirishnomalar
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-300">{stats.automated}</p>
          <p className="mt-1 text-xs text-slate-400">Davomat, baholar va to'lovlar</p>
        </Card>
        <Card variant="metric" className="p-3.5 sm:p-4 border-emerald-500/20 bg-emerald-950/10">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Yetkazilgan qabul qiluvchilar
          </p>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {stats.totalDelivered}
          </p>
          <p className="mt-1 text-xs text-slate-400">Telegram bot orqali</p>
        </Card>
      </div>

      {/* Filter Tabs & Content */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Barchasi ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ANNOUNCEMENT')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'ANNOUNCEMENT'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Ommaviy e'lonlar
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ATTENDANCE')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'ATTENDANCE'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Davomat ogohlantirishlari
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('GRADE')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'GRADE'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Baholar
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PAYMENT')}
            className={`min-h-[44px] px-4 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'PAYMENT'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            To'lov kvitansiyalari
          </button>
        </div>

        <NotificationLogsTable logs={filteredLogs} isLoading={isLoading} />
      </Card>

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
