import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import type { UserResponseDto } from '@nis/shared';
import { tokenStore } from '@/lib/token-store';
import { authApi } from './auth-api';
import { authKeys } from './keys';

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    (cb) => tokenStore.subscribe(cb),
    () => tokenStore.getAccess() !== null || tokenStore.getRefresh() !== null,
    () => false,
  );
}

export function useCurrentUserQuery() {
  const authed = useIsAuthenticated();
  return useQuery<UserResponseDto>({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: authed,
    staleTime: 60_000,
  });
}
