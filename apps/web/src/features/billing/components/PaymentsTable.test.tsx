import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PaymentRecordDto } from '@nis/shared';
import { PaymentsTable } from './PaymentsTable';

const mockPayment: PaymentRecordDto = {
  id: 'pay-1',
  studentId: 's-1',
  studentName: 'Karimov Shaxzod',
  studentCode: 'NIS-2026-00001',
  className: '5-A',
  amount: 2500000,
  method: 'CASH',
  status: 'CONFIRMED',
  receiptNumber: 'REC-202609-1234',
  month: '2026-09',
  paidAt: '2026-09-28T10:00:00.000Z',
  comment: 'Full tuition',
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
};

describe('PaymentsTable', () => {
  it('should_render_empty_state_when_no_payments', () => {
    render(<PaymentsTable data={[]} />);
    expect(screen.getByText("To'lovlar topilmadi")).toBeInTheDocument();
  });

  it('should_render_payment_row_with_details', () => {
    render(<PaymentsTable data={[mockPayment]} />);
    expect(screen.getByText('REC-202609-1234')).toBeInTheDocument();
    expect(screen.getByText('Karimov Shaxzod')).toBeInTheDocument();
    expect(screen.getByText('5-A')).toBeInTheDocument();
    expect(screen.getByText('Naqd')).toBeInTheDocument();
  });
});
