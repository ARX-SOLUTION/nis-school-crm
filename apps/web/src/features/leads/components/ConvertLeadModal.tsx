import React, { useState } from 'react';
import type { ClassResponseDto, ConvertToStudentRequestDto, LeadDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  lead: LeadDto | null;
  classes: ClassResponseDto[];
  onSubmit: (id: string, dto: ConvertToStudentRequestDto) => Promise<void>;
  isSubmitting: boolean;
}

export function ConvertLeadModal({
  open,
  onClose,
  lead,
  classes,
  onSubmit,
  isSubmitting,
}: Props): React.ReactElement {
  const [classId, setClassId] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('2015-05-15');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [error, setError] = useState<string>('');

  if (!lead) return <></>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await onSubmit(lead.id, {
        classId: classId || undefined,
        birthDate,
        gender,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "O'quvchiga qabul qilishda xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="O'quvchiga qabul qilish">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800 text-sm">{lead.fullName}</div>
          <div className="text-slate-600">
            Telefon: <span className="font-mono">{lead.phone}</span>
          </div>
          {lead.targetGradeLevel && (
            <div className="text-slate-600">Mo'ljallangan sinf: {lead.targetGradeLevel}-sinf</div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Biriktiriladigan sinf
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Sinf keyinroq biriktiriladi (biriktirmaslik)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gradeLevel}-sinf)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tug'ilgan sana <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jinsi <span className="text-rose-500">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="MALE">O'g'il bola (MALE)</option>
              <option value="FEMALE">Qiz bola (FEMALE)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Qabul qilish va kod berish
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
