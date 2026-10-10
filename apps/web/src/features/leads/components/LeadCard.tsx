import React, { useState } from 'react';
import { LEAD_STAGES, type LeadDto, type LeadStage } from '@nis/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  lead: LeadDto;
  onStageChange: (id: string, stage: LeadStage) => void;
  onConvert: (lead: LeadDto) => void;
  onDelete: (id: string) => void;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'lanilgan",
  TRIAL_SCHEDULED: 'Sinov darsi',
  CONTRACT_SENT: 'Shartnoma',
  ENROLLED: 'Qabul qilindi',
  LOST: "Yo'qotildi",
};

const SOURCE_LABELS: Record<string, { label: string; badge: string }> = {
  TELEGRAM: { label: 'Telegram', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  INSTAGRAM: { label: 'Instagram', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  FACEBOOK: { label: 'Facebook', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  WEBSITE: { label: 'Veb-sayt', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  RECOMMENDATION: { label: 'Tavsiya', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  WALK_IN: { label: 'Tashrif', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  OTHER: { label: 'Boshqa', badge: 'bg-slate-800 text-slate-400 border-slate-700' },
};

function getLeadInitials(name: string): string {
  if (!name) return 'L';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function GripIcon({ className = 'w-4 h-4' }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="6" r="1.5" fill="currentColor" />
      <circle cx="15" cy="6" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="9" cy="18" r="1.5" fill="currentColor" />
      <circle cx="15" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function LeadCard({ lead, onStageChange, onConvert, onDelete }: Props): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);

  const sourceInfo = SOURCE_LABELS[lead.source] ?? {
    label: lead.source,
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const initials = getLeadInitials(lead.fullName);

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`bg-slate-900 rounded-xl border p-4 transition-all select-none space-y-3 ${
        isDragging
          ? 'opacity-40 scale-[1.02] shadow-dark-lg rotate-1 border-blue-500/40 ring-2 ring-blue-500/30 cursor-grabbing'
          : 'border-slate-800 shadow-dark-sm hover:shadow-dark-md hover:border-slate-700 cursor-grab'
      }`}
    >
      {/* Top bar: Grip, Avatar, Name & Grade Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
            {initials}
          </div>
          <div className="min-w-0">
            <h4
              className="font-semibold text-sm text-slate-100 leading-snug truncate"
              title={lead.fullName}
            >
              {lead.fullName}
            </h4>
            {lead.parentName ? (
              <p
                className="text-xs text-slate-400 truncate"
                title={`Ota-onasi: ${lead.parentName}`}
              >
                Ota-onasi: {lead.parentName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {lead.targetGradeLevel ? (
            <span className="bg-blue-600/15 text-blue-400 border border-blue-500/30 text-xs font-bold px-2 py-0.5 rounded-lg">
              {lead.targetGradeLevel}-sinf
            </span>
          ) : null}
          <div
            className="text-slate-500 hover:text-slate-300 cursor-grab p-0.5"
            title="Surib tashlash uchun ushlang"
          >
            <GripIcon />
          </div>
        </div>
      </div>

      {/* Phone and Source */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <a
          href={`tel:${lead.phone}`}
          className="inline-flex items-center gap-1 font-mono font-medium text-slate-300 hover:text-blue-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            className="w-3.5 h-3.5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          {lead.phone}
        </a>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sourceInfo.badge}`}
        >
          {sourceInfo.label}
        </span>
      </div>

      {/* Notes if available */}
      {lead.notes ? (
        <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 line-clamp-2 leading-relaxed">
          {lead.notes}
        </div>
      ) : null}

      {/* Actions */}
      <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
        {/* Stage changer select (Accessible fallback for keyboard/mobile) */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <label className="text-[10px] font-semibold text-slate-400 uppercase">Bosqich:</label>
          <select
            value={lead.stage}
            onChange={(e) => onStageChange(lead.id, e.target.value as LeadStage)}
            className="text-xs rounded-lg border border-slate-700 bg-slate-900 py-1 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
          >
            {LEAD_STAGES.map((st) => (
              <option key={st} value={st}>
                {STAGE_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        {/* Enroll button if not yet enrolled */}
        {lead.stage !== 'ENROLLED' ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs font-semibold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 min-h-[44px]"
            onClick={() => onConvert(lead)}
          >
            ✓ O'quvchiga qabul qilish
          </Button>
        ) : (
          <div className="text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/30">
            Qabul qilingan
          </div>
        )}

        {/* Delete link */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onDelete(lead.id)}
            className="min-h-[44px] inline-flex items-center justify-center text-[10px] text-slate-500 hover:text-red-400 transition-colors px-2"
          >
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
