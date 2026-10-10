import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MethodologyNote } from './MethodologyNote';

describe('MethodologyNote', () => {
  it('renders collapsed by default and expands on click', async () => {
    const user = userEvent.setup();
    render(
      <MethodologyNote title="Metodika izohi">
        <p>Formula: A / B * 100</p>
      </MethodologyNote>,
    );

    const button = screen.getByRole('button', { name: /metodika izohi/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Formula: A \/ B \* 100/i)).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Formula: A \/ B \* 100/i)).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Formula: A \/ B \* 100/i)).not.toBeInTheDocument();
  });

  it('can be toggled using keyboard Enter and Space keys', async () => {
    const user = userEvent.setup();
    render(
      <MethodologyNote>
        <p>Threshold details</p>
      </MethodologyNote>,
    );

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Threshold details')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('honors defaultOpen prop when provided', () => {
    render(
      <MethodologyNote defaultOpen={true}>
        <p>Already visible explanation</p>
      </MethodologyNote>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Already visible explanation')).toBeInTheDocument();
  });

  it('associates button with content via aria-controls and matching id', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MethodologyNote>
        <p>Accessible panel content</p>
      </MethodologyNote>,
    );

    const button = screen.getByRole('button');
    const controlsId = button.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    await user.click(button);
    const contentPanel = container.querySelector(`#${CSS.escape(controlsId!)}`);
    expect(contentPanel).toBeInTheDocument();
    expect(contentPanel).toHaveTextContent('Accessible panel content');
  });
});
