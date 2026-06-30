export type SupportedLocale = 'vi' | 'en';

export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
