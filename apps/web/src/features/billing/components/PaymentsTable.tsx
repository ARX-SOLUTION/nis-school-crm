import React from 'react';
import type { PaymentRecordDto } from '@nis/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatUzbekSum } from '@/lib/format-currency';

interface Props {
  data: PaymentRecordDto[];
  isLoading?: boolean;
}

const METHOD_LABELS: Record<string, { label: string; badge: string }> = {
  CASH: { label: 'Naqd', badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' },
  CARD: { label: 'Karta', badge: 'bg-blue-950/40 text-blue-400 border-blue-500/30' },
  CLICK: { label: 'Click', badge: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' },
  PAYME: { label: 'Payme', badge: 'bg-teal-950/40 text-teal-400 border-teal-500/30' },
  BANK_TRANSFER: {
    label: "O'tkazma",
    badge: 'bg-purple-950/40 text-purple-400 border-purple-500/30',
  },
};

export function PaymentsTable({ data, isLoading }: Props): React.ReactElement {
  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        title="To'lovlar topilmadi"
        description="Tanlangan oy yoki parametrlar bo'yicha to'lovlar mavjud emas."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
              Chek №
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
              O'quvchi
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
              Sinf
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
              Oy
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
              Summa
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
              Usul
            </th>
            <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
              Sana
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((payment) => {
            const methodInfo = METHOD_LABELS[payment.method] ?? {
              label: payment.method,
              badge: 'bg-slate-800 text-slate-300 border-slate-700',
            };
            const paidDate = new Date(payment.paidAt).toLocaleDateString('uz-UZ');

            return (
              <tr key={payment.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-xs font-bold text-slate-100">
                  {payment.receiptNumber}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="font-semibold text-slate-100">
                    {payment.studentName || "Noma'lum"}
                  </div>
                  {payment.studentCode && (
                    <div className="text-xs font-mono text-slate-400">{payment.studentCode}</div>
                  )}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-slate-400">
                  {payment.className || '-'}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-slate-400">
                  {payment.month}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-100">
                  {formatUzbekSum(payment.amount)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${methodInfo.badge}`}
                  >
                    {methodInfo.label}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-slate-400">{paidDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
