import React, { useState, useEffect } from 'react';
import type { CreatePaymentRequestDto, PaymentMethod, StudentResponseDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatUzbekSum, describeSumUzbek } from '@/lib/format-currency';

interface Props {
  open: boolean;
  onClose: () => void;
  students: StudentResponseDto[];
  defaultStudentId?: string;
  defaultMonth?: string;
  onSubmit: (data: CreatePaymentRequestDto) => Promise<void>;
  isSubmitting: boolean;
}

const METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Naqd pul (CASH)', value: 'CASH' },
  { label: 'Plastik karta (CARD)', value: 'CARD' },
  { label: 'Click', value: 'CLICK' },
  { label: 'Payme', value: 'PAYME' },
  { label: "Bank o'tkazmasi", value: 'BANK_TRANSFER' },
];

export function RecordPaymentModal({
  open,
  onClose,
  students,
  defaultStudentId = '',
  defaultMonth,
  onSubmit,
  isSubmitting,
}: Props): React.ReactElement {
  const [studentId, setStudentId] = useState<string>(defaultStudentId);
  const [amount, setAmount] = useState<number>(2_500_000);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [month, setMonth] = useState<string>(defaultMonth || new Date().toISOString().slice(0, 7));
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (defaultStudentId) setStudentId(defaultStudentId);
    if (defaultMonth) setMonth(defaultMonth);
  }, [defaultStudentId, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError("Iltimos, o'quvchini tanlang");
      return;
    }
    if (amount <= 0) {
      setError("To'lov summasi musbat bo'lishi kerak");
      return;
    }
    setError('');

    try {
      await onSubmit({
        studentId,
        amount,
        method,
        month,
        comment: comment.trim() ? comment.trim() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "To'lovni saqlashda xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="To'lov qabul qilish">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-[#FEE2E2] p-3 text-xs font-medium text-error border border-error">
            {error}
          </div>
        )}

        {/* Student select */}
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">
            O'quvchi <span className="text-error">*</span>
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full text-sm rounded-lg border border-border p-2.5 min-h-[44px] text-tertiary bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          >
            <option value="">O'quvchini tanlang...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName} {s.firstName} ({s.studentCode})
              </option>
            ))}
          </select>
        </div>

        {/* Month picker */}
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">
            Qaysi oy uchun <span className="text-error">*</span>
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full text-sm rounded-lg border border-border p-2.5 min-h-[44px] text-tertiary bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">
            Summa (so'm) <span className="text-error">*</span>
          </label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1000}
            step={50000}
            placeholder="0"
            className="w-full text-base rounded-lg border border-border p-2.5 min-h-[44px] text-tertiary bg-surface font-mono tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />

          {/* Live zero-miscount prevention preview */}
          {amount > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#DBEAFE] border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-mono tabular-nums font-bold text-secondary text-sm">
                {formatUzbekSum(amount)}
              </span>
              {describeSumUzbek(amount) && (
                <span className="text-secondary font-medium">{describeSumUzbek(amount)}</span>
              )}
            </div>
          )}

          {amount > 50_000_000 && (
            <div className="mt-1 text-xs text-neutral-500 font-medium">
              Diqqat: Kiritilgan summa juda katta ({formatUzbekSum(amount)}). Iltimos, nollarni
              tekshiring!
            </div>
          )}

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[1_000_000, 2_000_000, 2_500_000, 3_000_000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-mono tabular-nums font-medium transition-colors min-h-[36px] ${
                  amount === preset
                    ? 'bg-primary text-tertiary shadow-sm'
                    : 'bg-muted-surface hover:bg-border text-tertiary'
                }`}
              >
                {formatUzbekSum(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">
            To'lov turi <span className="text-error">*</span>
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full text-sm rounded-lg border border-border p-2.5 min-h-[44px] text-tertiary bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-semibold text-tertiary mb-1">Izoh / Eslatma</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qo'shimcha ma'lumot..."
            className="w-full text-sm rounded-lg border border-border p-2.5 min-h-[44px] text-tertiary bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Modal actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            To'lovni saqlash
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
