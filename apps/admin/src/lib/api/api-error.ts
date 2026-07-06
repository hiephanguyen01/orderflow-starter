import { AxiosError, isAxiosError } from 'axios';

export type ApiErrorDetails = {
  statusCode: number | null;
  code: string | null;
  message: string;
  fieldErrors: Record<string, string>;
};

type BackendErrorObject = {
  statusCode?: unknown;
  code?: unknown;
  message?: unknown;
  errors?: unknown;
};

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readStatusCode(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function readFieldErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [field, message] of Object.entries(value)) {
    if (typeof message === 'string') {
      result[field] = message;
    }
  }

  return result;
}

export function parseApiError(error: unknown): ApiErrorDetails {
  if (!isAxiosError(error)) {
    return {
      statusCode: null,
      code: null,
      message: error instanceof Error ? error.message : 'Unexpected error',
      fieldErrors: {},
    };
  }

  const axiosError = error as AxiosError<BackendErrorObject>;

  const payload = axiosError.response?.data;

  const statusCode = readStatusCode(payload?.statusCode) ?? axiosError.response?.status ?? null;

  if (!payload) {
    return {
      statusCode,
      code: null,
      message: axiosError.message || 'Network request failed',
      fieldErrors: {},
    };
  }

  if (payload.message && typeof payload.message === 'object' && !Array.isArray(payload.message)) {
    const nested = payload.message as BackendErrorObject;

    return {
      statusCode,
      code: readString(nested.code),
      message: readString(nested.message) ?? axiosError.message,
      fieldErrors: readFieldErrors(nested.errors),
    };
  }

  return {
    statusCode,
    code: readString(payload.code),
    message: readString(payload.message) ?? axiosError.message,
    fieldErrors: readFieldErrors(payload.errors),
  };
}
