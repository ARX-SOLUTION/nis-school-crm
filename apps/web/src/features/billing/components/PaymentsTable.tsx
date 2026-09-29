import React from 'react';
import type { PaymentRecordDto } from '@nis/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatUzbekSum } from '@/lib/format-currency';

interface Props {
  data: PaymentRecordDto[];
  isLoading?: boolean;
}

const METHOD_LABELS: Record<string, { label: string; badge: string }> = {
  CASH: { label: 'Naqd', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CARD: { label: 'Karta', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  CLICK: { label: 'Click', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
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
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const paidDate = new Date(payment.paidAt).toLocaleDateString('uz-UZ');

            return (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3.5 font-mono text-xs font-bold text-slate-700">
                  {payment.receiptNumber}
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-slate-900">
                    {payment.studentName || "Noma'lum"}
                  </div>
                  {payment.studentCode && (
                    <div className="text-xs font-mono text-slate-400">{payment.studentCode}</div>
                  )}
                </td>
                <td className="p-3.5 text-xs font-medium text-slate-600">
                  {payment.className || '-'}
                </td>
                <td className="p-3.5 text-xs font-medium text-slate-600">{payment.month}</td>
                <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-900">
                  {formatUzbekSum(payment.amount)}
                </td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${methodInfo.badge}`}
                  >
                    {methodInfo.label}
                  </span>
                </td>
                <td className="p-3.5 text-xs text-slate-500">{paidDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
