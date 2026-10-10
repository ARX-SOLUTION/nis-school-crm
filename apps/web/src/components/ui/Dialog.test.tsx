import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog Component', () => {
  it('renders title, description, content and close button', () => {
    const handleClose = vi.fn();
    render(
      <Dialog
        open={true}
        onClose={handleClose}
        title="Test Modal Title"
        description="Test modal description"
      >
        <p>Modal body content</p>
      </Dialog>,
    );

    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Test modal description')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /yopish|close/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Dialog open={true} onClose={handleClose} title="Test Modal">
        <p>Body</p>
      </Dialog>,
    );

    const closeBtn = screen.getByRole('button', { name: /yopish|close/i });
    await userEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render content in document when open is false', () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Closed Modal Title">
        <p>Hidden body</p>
      </Dialog>,
    );

    expect(screen.queryByText('Closed Modal Title')).not.toBeInTheDocument();
  });
});
