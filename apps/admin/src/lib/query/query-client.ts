import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (!isAxiosError(error)) {
    return failureCount < 1;
  }

  const status = error.response?.status;

  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 422) {
    return false;
  }

  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },

      mutations: {
        retry: false,
      },
    },
  });
}
