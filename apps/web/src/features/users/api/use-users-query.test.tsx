import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./users-api', () => ({
  usersApi: {
    list: vi.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

import { usersApi } from './users-api';
import { useUsersQuery } from './use-users-query';

const wrapper =
  (): ((props: { children: ReactNode }) => ReactNode) =>
  ({ children }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

describe('useUsersQuery', () => {
  beforeEach(() => {
    (usersApi.list as ReturnType<typeof vi.fn>).mockClear();
  });

  it('should_call_list_with_the_supplied_query', async () => {
    const { result } = renderHook(() => useUsersQuery({ page: 1, limit: 20, role: 'MANAGER' }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(usersApi.list).toHaveBeenCalledWith({ page: 1, limit: 20, role: 'MANAGER' });
  });

  it('should_return_paginated_payload_from_api', async () => {
    const { result } = renderHook(() => useUsersQuery({ page: 1, limit: 20 }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta.total).toBe(0);
  });
});
