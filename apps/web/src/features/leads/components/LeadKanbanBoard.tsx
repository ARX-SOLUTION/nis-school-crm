import React, { useState } from 'react';
import { LEAD_STAGES, type LeadDto, type LeadStage } from '@nis/shared';
import { LeadCard } from './LeadCard';

interface Props {
  leads: LeadDto[];
  onStageChange: (id: string, stage: LeadStage) => void;
  onConvert: (lead: LeadDto) => void;
  onDelete: (id: string) => void;
}

const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; bg: string; dot: string; border: string; headerText: string }
> = {
  NEW: {
    label: 'Yangi',
    bg: 'bg-muted-surface',
    border: 'border-border',
    dot: 'bg-primary',
    headerText: 'text-tertiary',
  },
  CONTACTED: {
    label: "Bog'lanilgan",
    bg: 'bg-[#DBEAFE]',
    border: 'border-secondary/20/80',
    dot: 'bg-sky-500',
    headerText: 'text-sky-900',
  },
  TRIAL_SCHEDULED: {
    label: 'Sinov darsi',
    bg: 'bg-muted-surface/40',
    border: 'border-border/80',
    dot: 'bg-neutral-500',
    headerText: 'text-amber-900',
  },
  CONTRACT_SENT: {
    label: 'Shartnoma',
    bg: 'bg-purple-50/40',
    border: 'border-purple-200/80',
    dot: 'bg-purple-500',
    headerText: 'text-purple-900',
  },
  ENROLLED: {
    label: 'Qabul qilindi',
    bg: 'bg-[#E8F7D0]/40',
    border: 'border-success/80',
    dot: 'bg-success',
    headerText: 'text-success',
  },
  LOST: {
    label: "Yo'qotildi",
    bg: 'bg-[#FEE2E2]/30',
    border: 'border-error/80',
    dot: 'bg-rose-400',
    headerText: 'text-rose-900',
  },
};

export function LeadKanbanBoard({
  leads,
  onStageChange,
  onConvert,
  onDelete,
}: Props): React.ReactElement {
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: LeadStage) => {
    // Check if moving to child element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      if (dragOverStage === stage) {
        setDragOverStage(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onStageChange(leadId, stage);
    }
  };

  return (
    <div className="overflow-x-auto pb-6 pt-1 flex gap-4 min-w-full items-start scrollbar-thin">
      {LEAD_STAGES.map((stage) => {
        const config = STAGE_CONFIG[stage];
        const stageLeads = leads.filter((l) => l.stage === stage);
        const isTarget = dragOverStage === stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={(e) => handleDragLeave(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            data-stage={stage}
            className={`w-72 shrink-0 rounded-xl border p-3 flex flex-col gap-3 min-h-[520px] transition-all duration-150 ${
              isTarget
                ? 'border-primary bg-[#DBEAFE] ring-2 ring-secondary/20 shadow-md'
                : `${config.border} ${config.bg}`
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <h3 className={`font-bold text-xs uppercase tracking-wider ${config.headerText}`}>
                  {config.label}
                </h3>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-surface text-tertiary border border-border shadow-2xs">
                {stageLeads.length}
              </span>
            </div>

            {/* Drop Placeholder Indicator */}
            {isTarget ? (
              <div className="border-2 border-dashed border-secondary/20 bg-[#DBEAFE] rounded-xl p-3 text-center text-xs font-semibold text-secondary transition-all">
                Shu bosqichga tashlang
              </div>
            ) : null}

            {/* Leads list */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {stageLeads.length === 0 && !isTarget ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 text-center text-xs text-neutral-400 border border-dashed border-border rounded-xl px-3 leading-relaxed">
                  <span>Nomzodlar yo'q</span>
                  <span className="text-2xs text-neutral-400 mt-1">
                    Kartochkani bu yerga surib tashlang
                  </span>
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStageChange={onStageChange}
                    onConvert={onConvert}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
