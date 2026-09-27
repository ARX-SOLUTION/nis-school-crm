import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders range and total count accurately', () => {
    render(<Pagination page={2} limit={20} total={75} totalPages={4} onPageChange={vi.fn()} />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('21-40')).toBeInTheDocument();
  });

  it('disables Previous button on page 1 and enables Next button', () => {
    render(<Pagination page={1} limit={20} total={50} totalPages={3} onPageChange={vi.fn()} />);

    const prevBtn = screen.getByRole('button', { name: /oldingi sahifa/i });
    const nextBtn = screen.getByRole('button', { name: /keyingi sahifa/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
  });

  it('disables Next button on the last page', () => {
    render(<Pagination page={3} limit={20} total={50} totalPages={3} onPageChange={vi.fn()} />);

    const nextBtn = screen.getByRole('button', { name: /keyingi sahifa/i });
    expect(nextBtn).toBeDisabled();
  });

  it('invokes onPageChange when buttons are clicked', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={2} limit={20} total={100} totalPages={5} onPageChange={onPageChange} />,
    );

    const prevBtn = screen.getByRole('button', { name: /oldingi sahifa/i });
    await userEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    const nextBtn = screen.getByRole('button', { name: /keyingi sahifa/i });
    await userEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);

    const page4Btn = screen.getByRole('button', { name: '4-sahifa' });
    await userEvent.click(page4Btn);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('invokes onLimitChange when select dropdown changes', async () => {
    const onLimitChange = vi.fn();
    render(
      <Pagination
        page={1}
        limit={20}
        total={100}
        totalPages={5}
        onPageChange={vi.fn()}
        onLimitChange={onLimitChange}
      />,
    );

    const select = screen.getByLabelText(/qatorlar soni/i);
    await userEvent.selectOptions(select, '50');
    expect(onLimitChange).toHaveBeenCalledWith(50);
  });

  it('returns null when total is 0', () => {
    const { container } = render(
      <Pagination page={1} limit={20} total={0} totalPages={0} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
