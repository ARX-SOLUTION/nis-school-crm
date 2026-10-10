import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DebtorStudentDto } from '@nis/shared';
import { Dialog } from '@/components/ui/Dialog';
import { formatUzbekSum } from '@/lib/format-currency';
import { billingApi } from '../api/billing-api';

interface Props {
  debtor: DebtorStudentDto;
  onClose: () => void;
}

export function PaymentLinkModal({ debtor, onClose }: Props): React.ReactElement {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<{ paymeUrl: string; clickUrl: string } | null>(null);
  const [copiedType, setCopiedType] = useState<'payme' | 'click' | null>(null);
  const [simulating, setSimulating] = useState<'payme' | 'click' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    billingApi
      .getPaymentLink(debtor.studentCode, debtor.debtAmount)
      .then((res) => {
        if (mounted) {
          setLinks({ paymeUrl: res.paymeUrl, clickUrl: res.clickUrl });
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          // Fallback direct links
          const paymeParams = `m=64a1b2c3d4e5f6a7b8c9d0e1;ac.student_code=${debtor.studentCode};a=${debtor.debtAmount * 100}`;
          const paymeBase64 = btoa(paymeParams);
          setLinks({
            paymeUrl: `https://checkout.paycom.uz/${paymeBase64}`,
            clickUrl: `https://my.click.uz/services/pay?service_id=12345&merchant_id=67890&amount=${debtor.debtAmount}&transaction_param=${debtor.studentCode}`,
          });
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debtor]);

  const copyToClipboard = async (text: string, type: 'payme' | 'click') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSimulate = async (provider: 'payme' | 'click') => {
    setSimulating(provider);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (provider === 'payme') {
        await billingApi.simulatePaymePayment(debtor.studentCode, debtor.debtAmount);
      } else {
        await billingApi.simulateClickPayment(debtor.studentCode, debtor.debtAmount);
      }

      await queryClient.invalidateQueries({ queryKey: ['billing'] });
      setSuccessMsg(
        `${provider.toUpperCase()} orqali to'lov muvaffaqiyatli qabul qilindi va qarzdorlik so'ndirildi!`,
      );
    } catch {
      setErrorMsg("To'lov simulyatsiyasida xatolik yuz berdi");
    } finally {
      setSimulating(null);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Payme & Click To'lov Havolasi"
      description="Ota-onaga yuborish yoki to'g'ridan-to'g'ri to'lash"
    >
      {/* Student & Debt Summary Card */}
      <div className="rounded-xl bg-muted-surface p-4 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">O&apos;quvchi</span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
            {debtor.studentCode}
          </span>
        </div>
        <div className="mt-1 font-semibold text-tertiary text-base">{debtor.studentName}</div>
        <div className="text-xs text-neutral-400">{debtor.className || 'Sinf belgilanmagan'}</div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">Qarzdorlik miqdori:</span>
          <span className="text-base font-bold text-rose-400 tabular-nums font-mono">
            {formatUzbekSum(debtor.debtAmount)}
          </span>
        </div>
      </div>

      {successMsg ? (
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2">
          <svg
            className="h-4 w-4 text-emerald-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 font-medium">
          {errorMsg}
        </div>
      ) : null}

      {/* Gateway Action Buttons */}
      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-400">Havolalar yuklanmoqda...</div>
      ) : (
        <div className="mt-5 space-y-3">
          {/* Payme Row */}
          <div className="p-3 rounded-xl border border-teal-500/30 bg-teal-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                P
              </div>
              <div>
                <div className="text-sm font-semibold text-teal-100">Payme orqali to&apos;lov</div>
                <div className="text-[11px] text-teal-400">Payme ilovasi yoki veb-shlyuz</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => links && copyToClipboard(links.paymeUrl, 'payme')}
                className="min-h-[44px] flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-teal-300 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/30 rounded-lg transition-colors"
              >
                {copiedType === 'payme' ? 'Nusxalandi!' : 'Havola nusxalash'}
              </button>
              <a
                href={links?.paymeUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>To&apos;lash</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Click Row */}
          <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                C
              </div>
              <div>
                <div className="text-sm font-semibold text-sky-100">Click orqali to&apos;lov</div>
                <div className="text-[11px] text-sky-400">Click Up yoki Click shlyuzi</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => links && copyToClipboard(links.clickUrl, 'click')}
                className="min-h-[44px] flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 rounded-lg transition-colors"
              >
                {copiedType === 'click' ? 'Nusxalandi!' : 'Havola nusxalash'}
              </button>
              <a
                href={links?.clickUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>To&apos;lash</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Test Simulation Zone for Staff */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-xs font-medium text-neutral-400 mb-2">
              Webhook simulyatsiyasi (Kassir / Test):
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={simulating !== null}
                onClick={() => handleSimulate('payme')}
                className="min-h-[44px] flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-teal-500/30 text-teal-300 hover:bg-teal-950/50 disabled:opacity-50 transition-colors"
              >
                {simulating === 'payme' ? 'Bajarilmoqda...' : 'Payme Test Qabul'}
              </button>
              <button
                type="button"
                disabled={simulating !== null}
                onClick={() => handleSimulate('click')}
                className="min-h-[44px] flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-950/50 disabled:opacity-50 transition-colors"
              >
                {simulating === 'click' ? 'Bajarilmoqda...' : 'Click Test Qabul'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-muted-surface hover:bg-border text-tertiary text-sm font-medium transition-colors"
        >
          Yopish
        </button>
      </div>
    </Dialog>
  );
}
