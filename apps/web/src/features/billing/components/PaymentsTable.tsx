import React from 'react';
import type { PaymentRecordDto } from '@nis/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatUzbekSum } from '@/lib/format-currency';

interface Props {
  data: PaymentRecordDto[];
  isLoading?: boolean;
}

const METHOD_LABELS: Record<string, { label: string; badge: string }> = {
  CASH: { label: 'Naqd', badge: 'bg-[#E8F7D0] text-success border-success' },
  CARD: { label: 'Karta', badge: 'bg-[#DBEAFE] text-secondary border-secondary/20' },
  CLICK: { label: 'Click', badge: 'bg-muted-surface text-secondary border-border' },
  PAYME: { label: 'Payme', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  BANK_TRANSFER: {
    label: "O'tkazma",
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
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
          <tr className="border-b border-border bg-muted-surface text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <th scope="col" className="p-3.5">
              Chek №
            </th>
            <th scope="col" className="p-3.5">
              O'quvchi
            </th>
            <th scope="col" className="p-3.5">
              Sinf
            </th>
            <th scope="col" className="p-3.5">
              Oy
            </th>
            <th scope="col" className="p-3.5 text-right">
              Summa
            </th>
            <th scope="col" className="p-3.5 text-center">
              Usul
            </th>
            <th scope="col" className="p-3.5">
              Sana
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((payment) => {
            const methodInfo = METHOD_LABELS[payment.method] ?? {
              label: payment.method,
              badge: 'bg-muted-surface text-tertiary border-border',
            };
            const paidDate = new Date(payment.paidAt).toLocaleDateString('uz-UZ');

            return (
              <tr key={payment.id} className="hover:bg-muted-surface transition-colors">
                <td className="p-3.5 font-mono text-xs font-bold text-tertiary">
                  {payment.receiptNumber}
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-tertiary">
                    {payment.studentName || "Noma'lum"}
                  </div>
                  {payment.studentCode && (
                    <div className="text-xs font-mono text-neutral-400">{payment.studentCode}</div>
                  )}
                </td>
                <td className="p-3.5 text-xs font-medium text-neutral-500">
                  {payment.className || '-'}
                </td>
                <td className="p-3.5 text-xs font-medium text-neutral-500">{payment.month}</td>
                <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-tertiary">
                  {formatUzbekSum(payment.amount)}
                </td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${methodInfo.badge}`}
                  >
                    {methodInfo.label}
                  </span>
                </td>
                <td className="p-3.5 text-xs text-neutral-500">{paidDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
