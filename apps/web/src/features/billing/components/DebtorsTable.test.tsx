import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DebtorStudentDto } from '@nis/shared';
import { DebtorsTable } from './DebtorsTable';

const mockDebtor: DebtorStudentDto = {
  studentId: 's-1',
  studentName: 'Karimov Shaxzod',
  studentCode: 'NIS-2026-00001',
  className: '5-A',
  parentPhone: '+998901234567',
  monthlyFee: 2500000,
  paidAmount: 1000000,
  debtAmount: 1500000,
  month: '2026-09',
};

describe('DebtorsTable', () => {
  it('should_render_empty_state_when_no_debtors', () => {
    render(<DebtorsTable data={[]} onPay={vi.fn()} />);
    expect(screen.getByText('Qarzdorlar mavjud emas')).toBeInTheDocument();
  });

  it('should_render_debtor_row_with_amounts', () => {
    render(<DebtorsTable data={[mockDebtor]} onPay={vi.fn()} />);
    expect(screen.getByText('Karimov Shaxzod')).toBeInTheDocument();
    expect(screen.getByText('5-A')).toBeInTheDocument();
    expect(screen.getByText('+998901234567')).toBeInTheDocument();
  });

  it('should_trigger_onPay_when_button_clicked', async () => {
    const handlePay = vi.fn();
    render(<DebtorsTable data={[mockDebtor]} onPay={handlePay} />);

    const payBtn = screen.getByRole('button', { name: /to'lov kiritish/i });
    await userEvent.click(payBtn);

    expect(handlePay).toHaveBeenCalledWith('s-1');
  });
});
