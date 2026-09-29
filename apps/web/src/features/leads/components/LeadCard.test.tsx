import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LeadDto } from '@nis/shared';
import { LeadCard } from './LeadCard';

const mockLead: LeadDto = {
  id: 'lead-1',
  fullName: 'Aliyev Valijon',
  phone: '+998901234567',
  parentName: 'Aliyev Olim',
  targetGradeLevel: 5,
  source: 'TELEGRAM',
  stage: 'NEW',
  notes: 'Matematika kursiga qiziqdi',
  convertedStudentId: null,
  createdAt: '2026-09-27T10:00:00.000Z',
  updatedAt: '2026-09-27T10:00:00.000Z',
};

describe('LeadCard', () => {
  it('should_render_lead_name_phone_and_grade', () => {
    render(
      <LeadCard lead={mockLead} onStageChange={vi.fn()} onConvert={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('Aliyev Valijon')).toBeInTheDocument();
    expect(screen.getByText('+998901234567')).toBeInTheDocument();
    expect(screen.getByText('5-sinf')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('should_trigger_onConvert_when_convert_button_clicked', async () => {
    const handleConvert = vi.fn();
    render(
      <LeadCard
        lead={mockLead}
        onStageChange={vi.fn()}
        onConvert={handleConvert}
        onDelete={vi.fn()}
      />,
    );

    const convertBtn = screen.getByRole('button', { name: /o'quvchiga qabul qilish/i });
    await userEvent.click(convertBtn);

    expect(handleConvert).toHaveBeenCalledWith(mockLead);
  });

  it('should_be_draggable_and_set_data_on_drag_start', () => {
    render(
      <LeadCard lead={mockLead} onStageChange={vi.fn()} onConvert={vi.fn()} onDelete={vi.fn()} />,
    );

    const card = screen.getByText('Aliyev Valijon').closest('[draggable="true"]');
    expect(card).toBeInTheDocument();

    const setDataMock = vi.fn();
    fireEvent.dragStart(card!, {
      dataTransfer: {
        setData: setDataMock,
        effectAllowed: 'none',
      },
    });

    expect(setDataMock).toHaveBeenCalledWith('text/plain', 'lead-1');
  });
});
