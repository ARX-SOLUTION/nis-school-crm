import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SendBroadcastModal } from './SendBroadcastModal';

vi.mock('@/features/classes/api/use-classes-query', () => ({
  useClassesQuery: vi.fn().mockReturnValue({
    data: {
      data: [
        { id: 'cls-1', name: '7-A', academicYear: '2026-2027' },
        { id: 'cls-2', name: '8-B', academicYear: '2026-2027' },
      ],
    },
    isLoading: false,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SendBroadcastModal', () => {
  it('renders modal with target options and inputs when open', () => {
    renderWithClient(
      <SendBroadcastModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />,
    );

    expect(screen.getByText('Yangi ommaviy xabarnoma yuborish')).toBeInTheDocument();
    expect(screen.getByLabelText(/Xabar sarlavhasi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qabul qiluvchilar guruhi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xabar matni/i)).toBeInTheDocument();
    expect(screen.getByText('Xabarni yuborish')).toBeInTheDocument();
  });

  it('submits form with correct data when user fills fields', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    renderWithClient(
      <SendBroadcastModal
        open={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />,
    );

    const titleInput = screen.getByLabelText(/Xabar sarlavhasi/i);
    const messageInput = screen.getByLabelText(/Xabar matni/i);

    await user.type(titleInput, 'Majlis haqida');
    await user.type(messageInput, 'Ertaga barcha ota-onalar majlisi');

    const submitBtn = screen.getByText('Xabarni yuborish');
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Majlis haqida',
      message: 'Ertaga barcha ota-onalar majlisi',
      target: 'ALL_PARENTS',
      classId: undefined,
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows class selector when CLASS_PARENTS target is chosen', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <SendBroadcastModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />,
    );

    const targetSelect = screen.getByLabelText(/Qabul qiluvchilar guruhi/i);
    await user.selectOptions(targetSelect, 'CLASS_PARENTS');

    expect(screen.getByLabelText(/Sinfni tanlang/i)).toBeInTheDocument();
    expect(screen.getByText(/7-A \(2026-2027\)/i)).toBeInTheDocument();
  });
});
