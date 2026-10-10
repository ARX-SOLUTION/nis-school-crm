import React, { useState } from 'react';
import type { BranchDto } from '@nis/shared';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
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
    <Dialog
      open
      onClose={onClose}
      title={branch ? 'Filialni tahrirlash' : 'Yangi filial qo‘shish'}
      description="Filial ma'lumotlarini kiriting"
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-950/40 border border-red-500/30 p-2.5 text-xs text-red-300 font-medium"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="branch-name" className="block text-xs font-semibold text-slate-200 mb-1">
            Filial nomi *
          </label>
          <input
            id="branch-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nordic International School - Chilonzor"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-500 bg-slate-900"
          />
        </div>

        <div>
          <label htmlFor="branch-code" className="block text-xs font-semibold text-slate-200 mb-1">
            Filial kodi (Unikal) *
          </label>
          <input
            id="branch-code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CHILONZOR"
            className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-500 bg-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="branch-address"
            className="block text-xs font-semibold text-slate-200 mb-1"
          >
            Manzil
          </label>
          <input
            id="branch-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Bunyodkor shoh ko‘chasi, 42"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-500 bg-slate-900"
          />
        </div>

        <div>
          <label htmlFor="branch-phone" className="block text-xs font-semibold text-slate-200 mb-1">
            Telefon raqam
          </label>
          <input
            id="branch-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 71 200 00 00"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-500 bg-slate-900"
          />
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {branch ? 'Yangilash' : 'Yaratish'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
