import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubjectsPage } from './SubjectsPage';

vi.mock('@/features/subjects/api/use-subjects-queries', () => ({
  useSubjectsQuery: vi.fn(),
  useCreateSubjectMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSubjectMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { useSubjectsQuery } from '@/features/subjects/api/use-subjects-queries';

describe('SubjectsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderPage = (role: 'ADMIN' | 'TEACHER' = 'ADMIN') =>
    render(
      <QueryClientProvider client={queryClient}>
        <SubjectsPage actorRole={role} />
      </QueryClientProvider>,
    );

  it('renders filter controls inside a standardized Card container', () => {
    vi.mocked(useSubjectsQuery).mockReturnValue({
      data: {
        data: [
          {
            id: 'sub-1',
            name: 'Algebra',
            code: 'ALG-101',
            targetGradeLevels: [7, 8],
            defaultHoursPerWeek: 4,
            isActive: true,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderPage();

    const searchInput = screen.getByPlaceholderText(/search subjects/i);
    expect(searchInput).toBeInTheDocument();

    // Regression check: the search input must be wrapped in a Card container with p-4
    const filterCard = searchInput.closest('div.bg-surface') || searchInput.closest('.p-4');
    expect(filterCard).not.toBeNull();
    expect(filterCard).toHaveClass('p-4');
  });
});
