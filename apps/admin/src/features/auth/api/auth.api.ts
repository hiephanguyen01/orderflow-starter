import { apiClient, publicApiClient } from '@/lib/api/api-client';

import {
  CurrentAuthorization,
  CurrentUser,
  LoginInput,
  LoginResponse,
  LogoutAllResponse,
  RefreshResponse,
} from '../types/auth.types';

export const authApi = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await publicApiClient.post<LoginResponse>('/auth/login', input);

    return data;
  },

  async refresh(): Promise<RefreshResponse> {
    const { data } = await publicApiClient.post<RefreshResponse>('/auth/refresh');

    return data;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>('/auth/me');

    return data;
  },

  async getCurrentAuthorization(): Promise<CurrentAuthorization> {
    const { data } = await apiClient.get<CurrentAuthorization>('/auth/me/authorization');

    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async logoutAll(): Promise<LogoutAllResponse> {
    const { data } = await apiClient.post<LogoutAllResponse>('/auth/logout-all');

    return data;
  },
};
