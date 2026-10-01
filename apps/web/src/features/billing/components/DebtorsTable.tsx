import React, { useState } from 'react';
import type { DebtorStudentDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatUzbekSum } from '@/lib/format-currency';
import { PaymentLinkModal } from './PaymentLinkModal';

interface Props {
  data: DebtorStudentDto[];
  isLoading?: boolean;
  onPay: (studentId: string) => void;
}

export function DebtorsTable({ data, isLoading, onPay }: Props): React.ReactElement {
  const [gatewayDebtor, setGatewayDebtor] = useState<DebtorStudentDto | null>(null);

  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        title="Qarzdorlar mavjud emas"
        description="Barcha o'quvchilar to'lovlarni to'liq amalga oshirgan."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted-surface text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <th scope="col" className="p-3.5 w-12 text-center">
                #
              </th>
              <th scope="col" className="p-3.5">
                O'quvchi
              </th>
              <th scope="col" className="p-3.5">
                Sinf
              </th>
              <th scope="col" className="p-3.5">
                Telefon
              </th>
              <th scope="col" className="p-3.5 text-right">
                Oylik to'lov
              </th>
              <th scope="col" className="p-3.5 text-right">
                To'langan
              </th>
              <th scope="col" className="p-3.5 text-right">
                Qarzdorlik
              </th>
              <th scope="col" className="p-3.5 text-center">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((debtor, idx) => (
              <tr key={debtor.studentId} className="hover:bg-muted-surface transition-colors">
                <td className="p-3.5 text-center text-xs font-medium text-neutral-400">
                  {idx + 1}
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-tertiary">{debtor.studentName}</div>
                  <div className="text-xs font-mono text-neutral-400">{debtor.studentCode}</div>
                </td>
                <td className="p-3.5 text-xs font-medium text-neutral-500">
                  {debtor.className || '-'}
                </td>
                <td className="p-3.5 text-xs font-mono text-neutral-500">
                  {debtor.parentPhone || '-'}
                </td>
                <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap text-xs text-neutral-500">
                  {formatUzbekSum(debtor.monthlyFee)}
                </td>
                <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap text-xs text-success font-medium">
                  {formatUzbekSum(debtor.paidAmount)}
                </td>
                <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap font-bold text-error">
                  {formatUzbekSum(debtor.debtAmount)}
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => onPay(debtor.studentId)}>
                      To'lov kiritish
                    </Button>
                    <button
                      type="button"
                      onClick={() => setGatewayDebtor(debtor)}
                      title="Payme & Click to'lov havolasi"
                      className="min-h-[44px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <span className="font-bold text-[10px] tracking-tight">ONLINE TO'LOV</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gatewayDebtor ? (
        <PaymentLinkModal debtor={gatewayDebtor} onClose={() => setGatewayDebtor(null)} />
      ) : null}
    </>
  );
}
