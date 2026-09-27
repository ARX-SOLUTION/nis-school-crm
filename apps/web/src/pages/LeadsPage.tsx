import React, { useState } from 'react';
import type {
  ConvertToStudentRequestDto,
  CreateLeadRequestDto,
  LeadDto,
  LeadSource,
  LeadStage,
} from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';
import { ConvertLeadModal } from '@/features/leads/components/ConvertLeadModal';
import { CreateLeadModal } from '@/features/leads/components/CreateLeadModal';
import { LeadKanbanBoard } from '@/features/leads/components/LeadKanbanBoard';
import {
  useConvertToStudentMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useLeadsQuery,
  useLeadStatsQuery,
  useUpdateLeadStageMutation,
} from '@/features/leads/api/use-leads-queries';

export function LeadsPage(): React.ReactElement {
  const [search, setSearch] = useState<string>('');
  const [source, setSource] = useState<LeadSource | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [convertLead, setConvertLead] = useState<LeadDto | null>(null);
  const [successBanner, setSuccessBanner] = useState<string>('');

  const { data: leads = [], isLoading: leadsLoading } = useLeadsQuery({
    search: search.trim() ? search.trim() : undefined,
    source,
  });
  const { data: stats } = useLeadStatsQuery();
  const { data: classesData } = useClassesQuery({ limit: 100 });

  const createMutation = useCreateLeadMutation();
  const updateStageMutation = useUpdateLeadStageMutation();
  const convertMutation = useConvertToStudentMutation();
  const deleteMutation = useDeleteLeadMutation();

  const handleCreate = async (dto: CreateLeadRequestDto) => {
    await createMutation.mutateAsync(dto);
    setSuccessBanner("Yangi nomzod muvaffaqiyatli qo'shildi.");
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const STAGE_NAMES: Record<LeadStage, string> = {
    NEW: 'Yangi',
    CONTACTED: "Bog'lanilgan",
    TRIAL_SCHEDULED: 'Sinov darsi',
    CONTRACT_SENT: 'Shartnoma',
    ENROLLED: 'Qabul qilindi',
    LOST: "Yo'qotildi",
  };

  const handleStageChange = async (id: string, stage: LeadStage) => {
    await updateStageMutation.mutateAsync({ id, dto: { stage } });
    const targetLead = leads.find((l) => l.id === id);
    const leadName = targetLead?.fullName ? `"${targetLead.fullName}" nomzodi` : 'Nomzod';
    setSuccessBanner(`${leadName} "${STAGE_NAMES[stage]}" bosqichiga o'tkazildi.`);
    setTimeout(() => setSuccessBanner(''), 3500);
  };

  const handleConvertSubmit = async (id: string, dto: ConvertToStudentRequestDto) => {
    await convertMutation.mutateAsync({ id, dto });
    setSuccessBanner("Nomzod o'quvchilar safiga qabul qilindi va shaxsiy kodi berildi!");
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Haqiqatan ham ushbu nomzodni o'chirmoqchimisiz?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const classes = classesData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Qabul CRM (Lidlar Voronkasi)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Yangi arizalar, suhbatlar, sinov darslari va o'quvchiga qabul qilish jarayoni.
          </p>
        </div>

        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          + Yangi nomzod qo'shish
        </Button>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {successBanner}
        </div>
      )}

      {/* Pipeline Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-semibold uppercase text-slate-500">Jami nomzodlar</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{stats?.total ?? 0}</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-semibold uppercase text-blue-600">Yangi kelgan</div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {stats?.byStage.NEW ?? 0}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-semibold uppercase text-amber-600">Sinov darsida</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {stats?.byStage.TRIAL_SCHEDULED ?? 0}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-semibold uppercase text-emerald-600">Qabul qilindi</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {stats?.byStage.ENROLLED ?? 0}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-semibold uppercase text-purple-600">Konversiya foizi</div>
          <div className="text-xl font-bold font-mono text-purple-700 mt-1">
            {stats?.conversionRate ?? 0}%
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidiruv..."
          className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[240px]"
        />

        <select
          value={source ?? ''}
          onChange={(e) => setSource(e.target.value ? (e.target.value as LeadSource) : undefined)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Barcha manbalar</option>
          <option value="TELEGRAM">Telegram</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="WEBSITE">Veb-sayt</option>
          <option value="RECOMMENDATION">Tavsiya</option>
          <option value="WALK_IN">Tashrif</option>
          <option value="OTHER">Boshqa</option>
        </select>
      </div>

      {/* Kanban Board */}
      {leadsLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Voronka yuklanmoqda...</div>
      ) : (
        <LeadKanbanBoard
          leads={leads}
          onStageChange={handleStageChange}
          onConvert={(lead) => setConvertLead(lead)}
          onDelete={handleDelete}
        />
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      {/* Convert Lead to Student Modal */}
      <ConvertLeadModal
        open={Boolean(convertLead)}
        onClose={() => setConvertLead(null)}
        lead={convertLead}
        classes={classes}
        onSubmit={handleConvertSubmit}
        isSubmitting={convertMutation.isPending}
      />
    </div>
  );
}
