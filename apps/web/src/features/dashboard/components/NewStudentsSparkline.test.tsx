import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NewStudentsSparkline } from './NewStudentsSparkline';

describe('NewStudentsSparkline', () => {
  it('should_render_one_bar_per_data_point', () => {
    const series = [
      { date: '2026-04-17', count: 0 },
      { date: '2026-04-18', count: 1 },
      { date: '2026-04-19', count: 3 },
      { date: '2026-04-20', count: 0 },
      { date: '2026-04-21', count: 2 },
      { date: '2026-04-22', count: 5 },
      { date: '2026-04-23', count: 4 },
    ];
    const { container } = render(<NewStudentsSparkline series={series} />);
    const bars = container.querySelectorAll('rect');
    expect(bars).toHaveLength(7);
  });

  it('should_label_itself_for_screen_readers', () => {
    render(<NewStudentsSparkline series={[{ date: '2026-04-23', count: 1 }]} />);
    expect(screen.getByRole('img', { name: /new students/i })).toBeInTheDocument();
  });
});
