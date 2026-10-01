import React from 'react';
import type { NotificationLogDto, NotificationTarget, NotificationType } from '@nis/shared';

interface Props {
  logs: NotificationLogDto[];
  isLoading: boolean;
}

const TYPE_CONFIG: Record<NotificationType, { label: string; bg: string; text: string }> = {
  ANNOUNCEMENT: {
    label: "Ommaviy e'lon",
    bg: 'bg-[#DBEAFE]',
    text: 'text-secondary border-secondary/20',
  },
  ATTENDANCE: {
    label: 'Davomat ogohlantirishi',
    bg: 'bg-muted-surface',
    text: 'text-neutral-500 border-border',
  },
  GRADE: { label: 'Yangi baho', bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200' },
  PAYMENT: {
    label: "To'lov kvitansiyasi",
    bg: 'bg-[#E8F7D0]',
    text: 'text-success border-success',
  },
};

const TARGET_LABELS: Record<NotificationTarget, string> = {
  ALL_PARENTS: 'Barcha ota-onalar',
  ALL_TEACHERS: "O'qituvchilar",
  CLASS_PARENTS: 'Sinf ota-onalari',
  ALL_USERS: 'Barcha foydalanuvchilar',
};

export function NotificationLogsTable({ logs, isLoading }: Props): React.ReactElement {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-neutral-500 text-sm">
        Xabarnomalar tarixi yuklanmoqda...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-border rounded-lg bg-muted-surface">
        <p className="text-base font-medium text-tertiary">Hozircha xabarnomalar yuborilmagan</p>
        <p className="mt-1 text-sm text-neutral-500">
          Ota-onalarga yoki o'qituvchilarga tezkor xabar yuborish uchun yuqoridagi tugmani bosing.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg shadow-sm bg-surface">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-muted-surface font-semibold text-tertiary">
          <tr>
            <th scope="col" className="px-4 py-3">
              Sana & Vaqt
            </th>
            <th scope="col" className="px-4 py-3">
              Xabar sarlavhasi
            </th>
            <th scope="col" className="px-4 py-3">
              Turi
            </th>
            <th scope="col" className="px-4 py-3">
              Qabul qiluvchilar
            </th>
            <th scope="col" className="px-4 py-3">
              Kanal
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              Yetkazildi
            </th>
            <th scope="col" className="px-4 py-3">
              Yuboruvchi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-neutral-500">
          {logs.map((log) => {
            const typeConf = TYPE_CONFIG[log.type] || {
              label: log.type,
              bg: 'bg-muted-surface',
              text: 'text-tertiary border-border',
            };
            const targetLabel = TARGET_LABELS[log.target] || log.target;
            const dateStr = new Date(log.createdAt).toLocaleString('uz-UZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr key={log.id} className="hover:bg-muted-surface transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500 font-mono">
                  {dateStr}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-medium text-tertiary truncate" title={log.title}>
                    {log.title}
                  </div>
                  <div className="text-xs text-neutral-500 truncate" title={log.message}>
                    {log.message}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConf.bg} ${typeConf.text}`}
                  >
                    {typeConf.label}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-tertiary">
                  {targetLabel}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                    </svg>
                    Telegram
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted-surface text-tertiary">
                    {log.recipientCount} ta
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
                  {log.sentByName || 'Tizim'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
