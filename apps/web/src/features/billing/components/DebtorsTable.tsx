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
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 w-12 text-center">
                #
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                O'quvchi
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                Sinf
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                Telefon
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                Oylik to'lov
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                To'langan
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                Qarzdorlik
              </th>
              <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((debtor, idx) => (
              <tr key={debtor.studentId} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs font-medium text-slate-500">
                  {idx + 1}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="font-semibold text-slate-100">{debtor.studentName}</div>
                  <div className="text-xs font-mono text-slate-400">{debtor.studentCode}</div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-slate-400">
                  {debtor.className || '-'}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-slate-400">
                  {debtor.parentPhone || '-'}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap text-xs text-slate-400">
                  {formatUzbekSum(debtor.monthlyFee)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap text-xs text-emerald-400 font-medium">
                  {formatUzbekSum(debtor.paidAmount)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono tabular-nums whitespace-nowrap font-bold text-rose-400">
                  {formatUzbekSum(debtor.debtAmount)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => onPay(debtor.studentId)}>
                      To'lov kiritish
                    </Button>
                    <button
                      type="button"
                      onClick={() => setGatewayDebtor(debtor)}
                      title="Payme & Click to'lov havolasi"
                      className="min-h-[44px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border border-teal-500/30 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
