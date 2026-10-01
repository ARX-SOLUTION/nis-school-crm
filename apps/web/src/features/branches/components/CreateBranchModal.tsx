import React, { useState } from 'react';
import type { BranchDto } from '@nis/shared';
import { useCreateBranchMutation, useUpdateBranchMutation } from '../api/use-branches-query';

interface Props {
  branch?: BranchDto | null;
  onClose: () => void;
}

export function CreateBranchModal({ branch, onClose }: Props): React.ReactElement {
  const createMutation = useCreateBranchMutation();
  const updateMutation = useUpdateBranchMutation();

  const [name, setName] = useState(branch?.name || '');
  const [code, setCode] = useState(branch?.code || '');
  const [address, setAddress] = useState(branch?.address || '');
  const [phone, setPhone] = useState(branch?.phone || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Filial nomini kiriting');
      return;
    }
    if (!code.trim()) {
      setError('Filial kodini kiriting (masalan: CHILONZOR)');
      return;
    }

    try {
      if (branch) {
        await updateMutation.mutateAsync({
          id: branch.id,
          dto: { name, code: code.toUpperCase().trim(), address, phone },
        });
      } else {
        await createMutation.mutateAsync({
          name,
          code: code.toUpperCase().trim(),
          address,
          phone,
          isActive: true,
        });
      }
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Xatolik yuz berdi');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-tertiary">
            {branch ? 'Filialni tahrirlash' : 'Yangi filial qo‘shish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-500 rounded-lg hover:bg-muted-surface"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 font-medium">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Filial nomi *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nordic International School - Chilonzor"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">
              Filial kodi (Unikal) *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CHILONZOR"
              className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Manzil</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Bunyodkor shoh ko‘chasi, 42"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tertiary mb-1">Telefon raqam</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 71 200 00 00"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="mt-5 pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-neutral-500 hover:bg-muted-surface rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-tertiary bg-primary hover:bg-primary rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? 'Saqlanmoqda...' : branch ? 'Yangilash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
