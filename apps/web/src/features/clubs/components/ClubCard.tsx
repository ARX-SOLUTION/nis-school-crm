import React from 'react';
import { ClubCategory, ClubDto, ClubFeeType } from '@nis/shared';

interface ClubCardProps {
  club: ClubDto;
  onSelect: (club: ClubDto) => void;
  onEnrollClick: (club: ClubDto) => void;
}

const CATEGORY_CONFIG: Record<
  ClubCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  [ClubCategory.STEM_ROBOTICS]: {
    label: 'STEM & Robototexnika',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  [ClubCategory.SPORTS]: {
    label: 'Sport & Salomatlik',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [ClubCategory.ARTS_CRAFT]: {
    label: "San'at & Hunarmandchilik",
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  [ClubCategory.MUSIC_PERFORMING]: {
    label: 'Musiqa & Doira',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  [ClubCategory.LANGUAGES]: {
    label: 'Xorijiy Tillar',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  [ClubCategory.ACADEMIC_OLYMPIAD]: {
    label: 'Olimpiada & Mantiq',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

const DAY_LABELS: Record<number, string> = {
  1: 'Du',
  2: 'Se',
  3: 'Chor',
  4: 'Pay',
  5: 'Jum',
  6: 'Shan',
};

export const ClubCard: React.FC<ClubCardProps> = ({ club, onSelect, onEnrollClick }) => {
  const catConfig = CATEGORY_CONFIG[club.category] || {
    label: club.category,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const percentFull = Math.min(Math.round((club.enrolledCount / club.capacity) * 100), 100);
  const spotsLeft = Math.max(club.capacity - club.enrolledCount, 0);

  // Group schedules
  const daysText =
    club.schedules && club.schedules.length > 0
      ? club.schedules.map((s) => DAY_LABELS[s.dayOfWeek] || `${s.dayOfWeek}`).join(', ') +
        ` (${club.schedules[0].startTime} - ${club.schedules[0].endTime})`
      : 'Jadval belgilanmagan';

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-150">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}
        >
          {catConfig.label}
        </span>

        {club.feeType === ClubFeeType.PAID ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
            {formatPrice(club.monthlyFee)}/oy
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Bepul
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-semibold text-slate-900 line-clamp-1 mb-1">{club.name}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
        {club.description || "Ushbu to'garak uchun batafsil ma'lumot kiritilmagan."}
      </p>

      {/* Info Pills */}
      <div className="space-y-2 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
        {/* Instructor */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="font-medium text-slate-800 truncate">
            {club.instructorName || 'Murabbiy biriktirilmagan'}
          </span>
        </div>

        {/* Room & Branch */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">
            {club.roomNumber ? `Xona: ${club.roomNumber}` : 'Xona belgilanmagan'}
            {club.branchName ? ` • ${club.branchName}` : ''}
          </span>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-slate-700 font-medium truncate">{daysText}</span>
        </div>

        {/* Grade span */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span>
            Sinflar: {club.minGrade} - {club.maxGrade} sinflar
          </span>
        </div>
      </div>

      {/* Capacity & Progress */}
      <div className="mt-auto mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500 font-medium">To'garak sig'imi:</span>
          <span className="tabular-nums font-semibold text-slate-800">
            {club.enrolledCount} / {club.capacity} nafar
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentFull >= 100
                ? 'bg-rose-500'
                : percentFull >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${percentFull}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
          <span>{percentFull}% to'lgan</span>
          <span>{spotsLeft > 0 ? `${spotsLeft} ta bo'sh o'rin` : "To'liq band"}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onEnrollClick(club)}
          disabled={spotsLeft <= 0}
          className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + O'quvchi yozish
        </button>

        <button
          type="button"
          onClick={() => onSelect(club)}
          className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          Boshqarish & Davomat
        </button>
      </div>
    </div>
  );
};
