import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import {
  clearAccessToken,
  getAccessToken,
  notifyAuthorizationChanged,
  notifySessionExpired,
  setAccessToken,
} from './auth-session';

type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required');
}

export const publicApiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

function isAuthenticationEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return ['/auth/login', '/auth/register', '/auth/refresh'].some((endpoint) =>
    url.includes(endpoint),
  );
}

async function performRefresh(): Promise<string> {
  const { data } = await publicApiClient.post<RefreshResponse>('/auth/refresh');

  setAccessToken(data.accessToken);

  return data.accessToken;
}

export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (!token) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);

  headers.set('Authorization', `Bearer ${token}`);

  config.headers = headers;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    if (error.response?.status === 403) {
      notifyAuthorizationChanged();

      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._authRetry ||
      isAuthenticationEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._authRetry = true;

    try {
      const nextAccessToken = await refreshAccessToken();

      const headers = AxiosHeaders.from(originalRequest.headers);

      headers.set('Authorization', `Bearer ${nextAccessToken}`);

      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch {
      clearAccessToken();
      notifySessionExpired();

      return Promise.reject(error);
    }
  },
);
