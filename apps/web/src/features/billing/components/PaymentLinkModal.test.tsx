import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DebtorStudentDto } from '@nis/shared';
import { PaymentLinkModal } from './PaymentLinkModal';
import { billingApi } from '../api/billing-api';

vi.mock('../api/billing-api', () => ({
  billingApi: {
    getPaymentLink: vi.fn(),
    simulatePaymePayment: vi.fn(),
    simulateClickPayment: vi.fn(),
  },
}));

describe('PaymentLinkModal', () => {
  let queryClient: QueryClient;
  const mockDebtor: DebtorStudentDto = {
    studentId: 's-1',
    studentName: 'Ali Valiyev',
    studentCode: 'STD-001',
    className: '5-A',
    monthlyFee: 2500000,
    paidAmount: 1000000,
    debtAmount: 1500000,
    month: '2026-09',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(billingApi.getPaymentLink).mockResolvedValue({
      studentId: 's-1',
      studentCode: 'STD-001',
      studentName: 'Ali Valiyev',
      amount: 1500000,
      paymeUrl: 'https://checkout.paycom.uz/mockpayme',
      clickUrl: 'https://my.click.uz/services/pay?mockclick',
    });
  });

  const renderComponent = (onClose = vi.fn()) =>
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentLinkModal debtor={mockDebtor} onClose={onClose} />
      </QueryClientProvider>,
    );

  it('renders debtor info and debt amount correctly', async () => {
    renderComponent();
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText('STD-001')).toBeInTheDocument();
    expect(await screen.findByText(/payme orqali to'lov/i)).toBeInTheDocument();
    expect(screen.getByText(/click orqali to'lov/i)).toBeInTheDocument();
  });

  it('handles Payme webhook simulation test click', async () => {
    vi.mocked(billingApi.simulatePaymePayment).mockResolvedValue({ result: { state: 2 } } as never);
    renderComponent();

    const simBtn = await screen.findByRole('button', { name: /payme test qabul/i });
    await userEvent.click(simBtn);

    expect(billingApi.simulatePaymePayment).toHaveBeenCalledWith('STD-001', 1500000);
    expect(await screen.findByText(/muvaffaqiyatli qabul qilindi/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    renderComponent(handleClose);

    const closeBtn = screen.getByRole('button', { name: /^yopish$/i });
    await userEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
