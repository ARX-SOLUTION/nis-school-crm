import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ErrorResponseBody, LoginResponseDto } from '@nis/shared';
import { tokenStore } from './token-store';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export interface ApiError {
  status: number;
  error: string;
  message: string | string[];
  requestId?: string;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _skipRefresh?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  refreshInFlight = axios
    .post<LoginResponseDto>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: refresh },
      { headers: { 'Content-Type': 'application/json' } },
    )
    .then((res) => {
      tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
      return res.data.accessToken;
    })
    .catch(() => {
      tokenStore.clear();
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ErrorResponseBody>) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original._skipRefresh) {
      original._retry = true;
      const next = await tryRefresh();
      if (next) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)['Authorization'] = `Bearer ${next}`;
        return api.request(original);
      }
    }

    const body = error.response?.data;
    const normalised: ApiError = {
      status: status ?? 0,
      error: body?.error ?? error.code ?? 'NetworkError',
      message: body?.message ?? error.message,
      requestId: body?.requestId,
    };
    return Promise.reject(normalised);
  },
);

/** Used by `/auth/refresh` itself so it doesn't loop on its own 401. */
export function skipRefresh<T extends AxiosRequestConfig>(config: T): T {
  (config as RetryableConfig)._skipRefresh = true;
  return config;
}
