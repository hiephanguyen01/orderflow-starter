import axios, { type AxiosInstance } from 'axios';

export type CreateApiClientOptions = {
  baseURL: string;
  getAccessToken?: () => string | null | Promise<string | null>;
};

export function createApiClient(options: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15_000,
  });

  client.interceptors.request.use(async (config) => {
    const accessToken = await options.getAccessToken?.();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  return client;
}
