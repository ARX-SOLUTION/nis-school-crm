import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StudentResponseDto } from '@nis/shared';
import { RecordPaymentModal } from './RecordPaymentModal';

const mockStudents: StudentResponseDto[] = [
  {
    id: 's-1',
    studentCode: 'NIS-001',
    firstName: 'Aziz',
    lastName: 'Valiyev',
    middleName: null,
    birthDate: '2012-05-15',
    gender: 'MALE',
    gradeLevel: 5,
    classId: 'c-1',
    status: 'ACTIVE',
    parentFullName: 'Vali Valiyev',
    parentPhone: '+998901112233',
    parentTelegram: null,
    enrolledAt: '2026-09-01',
    leftAt: null,
    leftReason: null,
    createdAt: '2026-09-01',
  },
];

describe('RecordPaymentModal', () => {
  it('renders with all accessible form labels linked to input IDs', () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <RecordPaymentModal
        open={true}
        onClose={handleClose}
        students={mockStudents}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const studentSelect = screen.getByLabelText(/o'quvchi \*/i);
    expect(studentSelect).toHaveAttribute('id', 'payment-student');

    const monthInput = screen.getByLabelText(/qaysi oy uchun \*/i);
    expect(monthInput).toHaveAttribute('id', 'payment-month');

    const amountInput = screen.getByLabelText(/summa \(so'm\) \*/i);
    expect(amountInput).toHaveAttribute('id', 'payment-amount');

    const methodSelect = screen.getByLabelText(/to'lov turi \*/i);
    expect(methodSelect).toHaveAttribute('id', 'payment-method');

    const commentInput = screen.getByLabelText(/izoh \/ eslatma/i);
    expect(commentInput).toHaveAttribute('id', 'payment-comment');
  });

  it('submits valid payment data to onSubmit', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RecordPaymentModal
        open={true}
        onClose={handleClose}
        students={mockStudents}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const studentSelect = screen.getByLabelText(/o'quvchi \*/i);
    await user.selectOptions(studentSelect, 's-1');

    const submitBtn = screen.getByRole('button', { name: /to'lovni saqlash/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 's-1',
          amount: 2500000,
          method: 'CASH',
        }),
      );
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
