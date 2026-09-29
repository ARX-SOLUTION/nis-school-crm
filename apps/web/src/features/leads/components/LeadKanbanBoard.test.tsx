import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LeadDto } from '@nis/shared';
import { LeadKanbanBoard } from './LeadKanbanBoard';

const mockLead: LeadDto = {
  id: 'lead-1',
  fullName: 'Aliyev Valijon',
  phone: '+998901234567',
  source: 'TELEGRAM',
  stage: 'NEW',
  createdAt: '2026-09-27T10:00:00.000Z',
  updatedAt: '2026-09-27T10:00:00.000Z',
};

describe('LeadKanbanBoard', () => {
  it('should_render_all_kanban_columns', () => {
    render(
      <LeadKanbanBoard
        leads={[mockLead]}
        onStageChange={vi.fn()}
        onConvert={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /yangi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bog'lanilgan/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sinov darsi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /shartnoma/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /qabul qilindi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /yo'qotildi/i })).toBeInTheDocument();
    expect(screen.getByText('Aliyev Valijon')).toBeInTheDocument();
  });

  it('should_trigger_onStageChange_when_card_is_dropped_on_column', () => {
    const handleStageChange = vi.fn();
    render(
      <LeadKanbanBoard
        leads={[mockLead]}
        onStageChange={handleStageChange}
        onConvert={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Target the 'TRIAL_SCHEDULED' column
    const trialColumn = document.querySelector('[data-stage="TRIAL_SCHEDULED"]');
    expect(trialColumn).toBeInTheDocument();

    // Trigger drop with lead id
    fireEvent.drop(trialColumn!, {
      dataTransfer: {
        getData: (format: string) => (format === 'text/plain' ? 'lead-1' : ''),
      },
    });

    expect(handleStageChange).toHaveBeenCalledWith('lead-1', 'TRIAL_SCHEDULED');
  });
});
