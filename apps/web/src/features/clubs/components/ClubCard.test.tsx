import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClubCard } from './ClubCard';
import { ClubCategory, ClubDto, ClubFeeType, ClubStatus } from '@nis/shared';

describe('ClubCard', () => {
  const mockClub: ClubDto = {
    id: 'club-1',
    name: 'Doira va milliy musiqa',
    category: ClubCategory.MUSIC_PERFORMING,
    description: "Milliy cholg'ular va doira san'ati",
    capacity: 20,
    enrolledCount: 14,
    minGrade: 1,
    maxGrade: 11,
    feeType: ClubFeeType.FREE,
    monthlyFee: 0,
    status: ClubStatus.ACTIVE,
    instructorName: 'Abduvali Mirzayev',
    roomNumber: 'Musiqa-1',
    branchName: 'Bosh Bino',
    schedules: [
      {
        dayOfWeek: 1,
        startTime: '15:30',
        endTime: '17:00',
        roomNumber: 'Musiqa-1',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders club information, category and capacity', () => {
    const onSelect = vi.fn();
    const onEnroll = vi.fn();

    render(<ClubCard club={mockClub} onSelect={onSelect} onEnrollClick={onEnroll} />);

    expect(screen.getByText('Doira va milliy musiqa')).toBeDefined();
    expect(screen.getByText('Musiqa & Doira')).toBeDefined();
    expect(screen.getByText('Abduvali Mirzayev')).toBeDefined();
    expect(screen.getByText('Bepul')).toBeDefined();
    expect(screen.getByText(/14 \/ 20 nafar/)).toBeDefined();
  });

  it('triggers onSelect when clicking Boshqarish & Davomat', () => {
    const onSelect = vi.fn();
    const onEnroll = vi.fn();

    render(<ClubCard club={mockClub} onSelect={onSelect} onEnrollClick={onEnroll} />);

    const btn = screen.getByRole('button', { name: /Boshqarish & Davomat/i });
    fireEvent.click(btn);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockClub);
  });

  it('renders paid badge and formatted price when club is paid', () => {
    const paidClub: ClubDto = {
      ...mockClub,
      feeType: ClubFeeType.PAID,
      monthlyFee: 350000,
    };

    render(<ClubCard club={paidClub} onSelect={vi.fn()} onEnrollClick={vi.fn()} />);

    expect(screen.getByText("350 000 so'm/oy")).toBeDefined();
  });
});
