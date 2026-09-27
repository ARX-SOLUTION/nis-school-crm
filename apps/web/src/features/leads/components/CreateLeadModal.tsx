import React, { useState } from 'react';
import { type CreateLeadRequestDto, type LeadSource } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLeadRequestDto) => Promise<void>;
  isSubmitting: boolean;
}

const SOURCE_OPTIONS: { label: string; value: LeadSource }[] = [
  { label: 'Telegram', value: 'TELEGRAM' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Veb-sayt', value: 'WEBSITE' },
  { label: 'Tavsiya', value: 'RECOMMENDATION' },
  { label: 'Tashrif (Walk-in)', value: 'WALK_IN' },
  { label: 'Boshqa', value: 'OTHER' },
];

export function CreateLeadModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: Props): React.ReactElement {
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [targetGradeLevel, setTargetGradeLevel] = useState<number>(5);
  const [source, setSource] = useState<LeadSource>('TELEGRAM');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Iltimos, to'liq ismni kiriting");
      return;
    }
    if (!phone.trim()) {
      setError('Iltimos, telefon raqamni kiriting');
      return;
    }
    setError('');

    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        parentName: parentName.trim() ? parentName.trim() : undefined,
        targetGradeLevel,
        source,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      // reset form
      setFullName('');
      setPhone('');
      setParentName('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lidni saqlashda xatolik yuz berdi');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Yangi lid (nomzod) qo'shish">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            O'quvchi ismi familiyasi <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masalan: Aliyev Valijon"
            required
            className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Telefon raqam <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998901234567"
            required
            className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ota-ona ismi</label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Aliyev Olim"
              className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mo'ljallangan sinf
            </label>
            <select
              value={targetGradeLevel}
              onChange={(e) => setTargetGradeLevel(Number(e.target.value))}
              className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}-sinf
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Qayerdan keldi (Manba)
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource)}
            className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Eslatma yoki izoh
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Qiziqishlari, dars jadvali xohishi..."
            className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Lidni saqlash
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
