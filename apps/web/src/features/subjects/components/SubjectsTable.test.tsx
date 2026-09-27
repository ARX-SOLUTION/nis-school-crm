import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SubjectResponseDto } from '@nis/shared';
import { SubjectsTable } from './SubjectsTable';

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const mockSubject: SubjectResponseDto = {
  id: 'sub-1',
  code: 'MATH',
  name: 'Mathematics',
  gradeLevels: [1, 2, 3, 4],
  defaultHoursPerWeek: 4,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('SubjectsTable', () => {
  it('should render subject code, name, and hours', () => {
    renderWithClient(<SubjectsTable subjects={[mockSubject]} canManage={true} />);
    expect(screen.getByText('MATH')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('4 hrs')).toBeInTheDocument();
  });

  it('should render empty state when list is empty', () => {
    renderWithClient(<SubjectsTable subjects={[]} canManage={true} />);
    expect(screen.getByText(/No subjects found/i)).toBeInTheDocument();
    expect(screen.getByText(/Get started by adding academic subjects/i)).toBeInTheDocument();
  });

  it('should show delete button when canManage is true', () => {
    renderWithClient(<SubjectsTable subjects={[mockSubject]} canManage={true} />);
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('should hide delete button when canManage is false', () => {
    renderWithClient(<SubjectsTable subjects={[mockSubject]} canManage={false} />);
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });
});
