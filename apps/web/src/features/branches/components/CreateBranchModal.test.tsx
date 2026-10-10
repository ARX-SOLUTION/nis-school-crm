import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateBranchModal } from './CreateBranchModal';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('CreateBranchModal Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderModal = (props: Parameters<typeof CreateBranchModal>[0]) =>
    render(
      <QueryClientProvider client={queryClient}>
        <CreateBranchModal {...props} />
      </QueryClientProvider>,
    );

  it('renders creation mode with accessible labels bound to inputs', () => {
    const handleClose = vi.fn();
    renderModal({ onClose: handleClose });

    expect(screen.getByRole('heading', { name: /yangi filial qo‘shish/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/filial nomi \*/i);
    expect(nameInput).toHaveAttribute('id', 'branch-name');

    const codeInput = screen.getByLabelText(/filial kodi \(unikal\) \*/i);
    expect(codeInput).toHaveAttribute('id', 'branch-code');

    const addressInput = screen.getByLabelText(/manzil/i);
    expect(addressInput).toHaveAttribute('id', 'branch-address');

    const phoneInput = screen.getByLabelText(/telefon raqam/i);
    expect(phoneInput).toHaveAttribute('id', 'branch-phone');
  });

  it('populates fields and updates an existing branch', async () => {
    const handleClose = vi.fn();
    vi.mocked(api.patch).mockResolvedValue({ data: { id: 'b-1' } });

    renderModal({
      branch: {
        id: 'b-1',
        name: 'Chilonzor Filiali',
        code: 'CHILONZOR',
        address: 'Tashkent',
        phone: '+998712000000',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      onClose: handleClose,
    });

    expect(screen.getByRole('heading', { name: /filialni tahrirlash/i })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/filial nomi \*/i);
    expect(nameInput).toHaveValue('Chilonzor Filiali');

    const submitBtn = screen.getByRole('button', { name: /yangilash/i });
    await userEvent.click(submitBtn);

    expect(api.patch).toHaveBeenCalledWith('/branches/b-1', {
      name: 'Chilonzor Filiali',
      code: 'CHILONZOR',
      address: 'Tashkent',
      phone: '+998712000000',
    });
    expect(handleClose).toHaveBeenCalled();
  });
});
