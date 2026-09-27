import React, { useState } from 'react';
import type { CreatePaymentRequestDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { formatUzbekSum } from '@/lib/format-currency';
import { Pagination } from '@/components/ui/Pagination';
import { DebtorsTable } from '@/features/billing/components/DebtorsTable';
import { PaymentsTable } from '@/features/billing/components/PaymentsTable';
import { RecordPaymentModal } from '@/features/billing/components/RecordPaymentModal';
import {
  useBillingStatsQuery,
  useDebtorsQuery,
  usePaymentsQuery,
  useRecordPaymentMutation,
} from '@/features/billing/api/use-billing-queries';
import { useStudentsQuery } from '@/features/students/api/use-students-query';

export function BillingPage(): React.ReactElement {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [paymentsPage, setPaymentsPage] = useState<number>(1);
  const [paymentsLimit, setPaymentsLimit] = useState<number>(20);
  const [activeTab, setActiveTab] = useState<'payments' | 'debtors'>('payments');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalStudentId, setModalStudentId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { data: stats, isLoading: statsLoading } = useBillingStatsQuery(selectedMonth);
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentsQuery({
    month: selectedMonth,
    page: paymentsPage,
    limit: paymentsLimit,
  });
  const { data: debtors = [], isLoading: debtorsLoading } = useDebtorsQuery(selectedMonth);
  const { data: studentsData } = useStudentsQuery({
    limit: 100,
    status: 'ACTIVE',
  });

  const recordPaymentMutation = useRecordPaymentMutation();

  const handleOpenModal = (studentId = '') => {
    setModalStudentId(studentId);
    setModalOpen(true);
    setSuccessMessage('');
  };

  const handleRecordPayment = async (data: CreatePaymentRequestDto) => {
    await recordPaymentMutation.mutateAsync(data);
    setSuccessMessage("To'lov muvaffaqiyatli saqlandi va chek rasmiylashtirildi.");
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const payments = paymentsData?.data ?? [];
  const students = studentsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Moliya va To'lovlar</h1>
          <p className="text-sm text-slate-500 mt-1">
            O'quvchilar shartnoma to'lovlari hisobi, tushumlar tahlili va qarzdorlar monitoringi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPaymentsPage(1);
            }}
            className="text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Button variant="primary" onClick={() => handleOpenModal()}>
            + To'lov qabul qilish
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Jami tushum ({selectedMonth})
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {statsLoading ? '...' : formatUzbekSum(stats?.totalCollectedThisMonth ?? 0)}
          </div>
          <div className="mt-1 text-xs text-slate-400">O'quvchilar tomonidan to'langan</div>
        </div>

        {/* Expected */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kutilayotgan summa
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {statsLoading ? '...' : formatUzbekSum(stats?.expectedThisMonth ?? 0)}
          </div>
          <div className="mt-1 text-xs text-slate-400">Faol o'quvchilar shartnomalari bo'yicha</div>
        </div>

        {/* Collection Rate */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Yig'ish ko'rsatkichi
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600">
            {statsLoading ? '...' : `${stats?.collectionRate ?? 0}%`}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.collectionRate ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Debtors count */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Qarzdor o'quvchilar
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600">
            {statsLoading ? '...' : (stats?.debtorCount ?? 0)} nafar
          </div>
          <div className="mt-1 text-xs text-slate-400">To'lov muddati kechikkan</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          To'lovlar tarixi ({payments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('debtors')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'debtors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Qarzdorlar ro'yxati ({debtors.length})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'payments' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <PaymentsTable data={payments} isLoading={paymentsLoading} />
          {paymentsData && paymentsData.meta ? (
            <Pagination
              page={paymentsData.meta.page}
              totalPages={paymentsData.meta.totalPages}
              total={paymentsData.meta.total}
              limit={paymentsData.meta.limit}
              onPageChange={setPaymentsPage}
              onLimitChange={(l) => {
                setPaymentsLimit(l);
                setPaymentsPage(1);
              }}
            />
          ) : null}
        </div>
      ) : (
        <DebtorsTable
          data={debtors}
          isLoading={debtorsLoading}
          onPay={(studentId) => handleOpenModal(studentId)}
        />
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students}
        defaultStudentId={modalStudentId}
        defaultMonth={selectedMonth}
        onSubmit={handleRecordPayment}
        isSubmitting={recordPaymentMutation.isPending}
      />
    </div>
  );
}
