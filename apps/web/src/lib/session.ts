import axios from 'axios';
import type { LoginResponseDto } from '@nis/shared';
import { tokenStore } from './token-store';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/**
 * Standalone refresh used by the router guard before it hands the user
 * into the authenticated shell. Lives outside `lib/api.ts` to avoid an
 * import cycle with the axios interceptor that ALSO uses the token store.
 */
export async function refreshSession(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const res = await axios.post<LoginResponseDto>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: refresh },
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
}
