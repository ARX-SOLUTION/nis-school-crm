import React, { useEffect, useState } from 'react';
import { ClubCategory, ClubFeeType, CreateClubPayload } from '@nis/shared';
import { clubsApi } from '../api/clubs-api';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { value: ClubCategory; label: string }[] = [
  { value: ClubCategory.STEM_ROBOTICS, label: 'STEM & Robototexnika' },
  { value: ClubCategory.SPORTS, label: 'Sport & Salomatlik' },
  { value: ClubCategory.ARTS_CRAFT, label: "San'at & Hunarmandchilik" },
  { value: ClubCategory.MUSIC_PERFORMING, label: 'Musiqa & Doira' },
  { value: ClubCategory.LANGUAGES, label: 'Xorijiy Tillar' },
  { value: ClubCategory.ACADEMIC_OLYMPIAD, label: 'Olimpiada & Mantiq' },
];

const DAYS = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
];

export const CreateClubModal: React.FC<CreateClubModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClubCategory>(ClubCategory.STEM_ROBOTICS);
  const [description, setDescription] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [instructorPhone, setInstructorPhone] = useState('');
  const [capacity, setCapacity] = useState(15);
  const [minGrade, setMinGrade] = useState(1);
  const [maxGrade, setMaxGrade] = useState(11);
  const [feeType, setFeeType] = useState<ClubFeeType>(ClubFeeType.FREE);
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  const [schedules, setSchedules] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  >([
    { dayOfWeek: 1, startTime: '15:30', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '15:30', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '15:30', endTime: '17:00' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key listener (Anti-Slop R-32 Keyboard Accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddScheduleSlot = () => {
    setSchedules((prev) => [...prev, { dayOfWeek: 2, startTime: '16:00', endTime: '17:30' }]);
  };

  const handleRemoveScheduleSlot = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = (
    index: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime',
    value: string | number,
  ) => {
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Iltimos, to'garak nomini kiriting");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateClubPayload = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        instructorName: instructorName.trim() || undefined,
        instructorPhone: instructorPhone.trim() || undefined,
        capacity: Number(capacity) || 15,
        minGrade: Number(minGrade) || 1,
        maxGrade: Number(maxGrade) || 11,
        feeType,
        monthlyFee: feeType === ClubFeeType.PAID ? Number(monthlyFee) : 0,
        schedules,
      };

      await clubsApi.create(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || "To'garakni saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-club-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 id="create-club-title" className="text-base font-semibold text-slate-900">
              Yangi to'garak / doira tashkil qilish
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Maktabda darsdan tashqari faoliyat va ijodiy to'garak parametrlari
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Modalni yopish"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-rose-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-club-name" className="block font-semibold text-slate-700 mb-1">
                To'garak nomi <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-club-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Doira va milliy musiqa ansambli"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-club-category"
                className="block font-semibold text-slate-700 mb-1"
              >
                Toifa / Yo'nalish
              </label>
              <select
                id="create-club-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ClubCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-club-desc" className="block font-semibold text-slate-700 mb-1">
              To'garak haqida qisqacha tavsif
            </label>
            <textarea
              id="create-club-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O'quv kursi maqsadi, amaliy mashg'ulotlar rejasi..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Row 2: Instructor details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-instructor-name"
                className="block font-semibold text-slate-700 mb-1"
              >
                Murabbiy / Ustoz F.I.Sh.
              </label>
              <input
                id="create-instructor-name"
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Masalan: Sardor Rahimov"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-instructor-phone"
                className="block font-semibold text-slate-700 mb-1"
              >
                Murabbiy telefoni
              </label>
              <input
                id="create-instructor-phone"
                type="text"
                value={instructorPhone}
                onChange={(e) => setInstructorPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Row 3: Capacity & Grades */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label
                htmlFor="create-club-capacity"
                className="block font-semibold text-slate-700 mb-1"
              >
                Maksimal sig'im:
              </label>
              <input
                id="create-club-capacity"
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="create-club-mingrade"
                className="block font-semibold text-slate-700 mb-1"
              >
                Min. sinf:
              </label>
              <input
                id="create-club-mingrade"
                type="number"
                min={1}
                max={11}
                value={minGrade}
                onChange={(e) => setMinGrade(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="create-club-maxgrade"
                className="block font-semibold text-slate-700 mb-1"
              >
                Maks. sinf:
              </label>
              <input
                id="create-club-maxgrade"
                type="number"
                min={1}
                max={11}
                value={maxGrade}
                onChange={(e) => setMaxGrade(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Row 4: Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-club-feetype"
                className="block font-semibold text-slate-700 mb-1"
              >
                To'lov turi:
              </label>
              <select
                id="create-club-feetype"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as ClubFeeType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value={ClubFeeType.FREE}>Bepul (Maktab dasturida)</option>
                <option value={ClubFeeType.PAID}>Pullik (Qo'shimcha abonent to'lovi)</option>
              </select>
            </div>

            {feeType === ClubFeeType.PAID && (
              <div>
                <label
                  htmlFor="create-club-feeamount"
                  className="block font-semibold text-slate-700 mb-1"
                >
                  Oylik to'lov summasi (so'm):
                </label>
                <input
                  id="create-club-feeamount"
                  type="number"
                  min={0}
                  step={10000}
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  placeholder="350000"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 tabular-nums"
                />
              </div>
            )}
          </div>

          {/* Row 5: Schedule slots */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Mashg'ulot kunlari va vaqtlari:
              </label>
              <button
                type="button"
                onClick={handleAddScheduleSlot}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
              >
                + Vaqt qo'shish
              </button>
            </div>

            <div className="space-y-2">
              {schedules.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) =>
                      handleUpdateSchedule(index, 'dayOfWeek', Number(e.target.value))
                    }
                    className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={(e) => handleUpdateSchedule(index, 'startTime', e.target.value)}
                      className="w-16 px-2 py-1 text-xs text-center bg-white border border-slate-300 rounded-md tabular-nums"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={(e) => handleUpdateSchedule(index, 'endTime', e.target.value)}
                      className="w-16 px-2 py-1 text-xs text-center bg-white border border-slate-300 rounded-md tabular-nums"
                    />
                  </div>

                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleSlot(index)}
                      className="p-1 text-rose-500 hover:text-rose-700 ml-auto"
                      aria-label="Vaqtni o'chirish"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saqlanmoqda...' : "To'garakni yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
