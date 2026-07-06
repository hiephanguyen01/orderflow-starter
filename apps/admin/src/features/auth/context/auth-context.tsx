'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  clearAccessToken,
  setAccessToken,
  subscribeToAuthorizationChanged,
  subscribeToSessionExpired,
} from '@/lib/api/auth-session';

import { authApi } from '../api/auth.api';
import { AuthStatus, CurrentAuthorization, CurrentUser, LoginInput } from '../types/auth.types';

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  authorization: CurrentAuthorization | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  refreshAuthorization: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authorization, setAuthorization] = useState<CurrentAuthorization | null>(null);

  const authorizationRefreshPromise = useRef<Promise<void> | null>(null);

  const clearAuthentication = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setAuthorization(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const loadSessionContext = useCallback(async () => {
    const [currentUser, currentAuthorization] = await Promise.all([
      authApi.getCurrentUser(),
      authApi.getCurrentAuthorization(),
    ]);

    setUser(currentUser);
    setAuthorization(currentAuthorization);
    setStatus('authenticated');
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const currentUser = await authApi.getCurrentUser();

    setUser(currentUser);
  }, []);

  const refreshAuthorization = useCallback((): Promise<void> => {
    if (authorizationRefreshPromise.current) {
      return authorizationRefreshPromise.current;
    }

    const promise = authApi
      .getCurrentAuthorization()
      .then((currentAuthorization) => {
        setAuthorization(currentAuthorization);
      })
      .finally(() => {
        authorizationRefreshPromise.current = null;
      });

    authorizationRefreshPromise.current = promise;

    return promise;
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const refreshResult = await authApi.refresh();

      setAccessToken(refreshResult.accessToken);

      await loadSessionContext();
    } catch {
      clearAuthentication();
    }
  }, [clearAuthentication, loadSessionContext]);

  useEffect(() => {
    // Session restoration is inherently async (network round-trip to /auth/refresh
    // and /auth/me); the resulting setState calls happen after an await, not
    // synchronously during this effect's commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    return subscribeToSessionExpired(clearAuthentication);
  }, [clearAuthentication]);

  useEffect(() => {
    return subscribeToAuthorizationChanged(() => {
      if (status === 'authenticated') {
        void refreshAuthorization();
      }
    });
  }, [refreshAuthorization, status]);

  useEffect(() => {
    const handleWindowFocus = (): void => {
      if (status === 'authenticated') {
        void refreshAuthorization();
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [refreshAuthorization, status]);

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      const result = await authApi.login(input);

      setAccessToken(result.accessToken);

      try {
        await loadSessionContext();

        queryClient.clear();
      } catch (error: unknown) {
        clearAuthentication();

        throw error;
      }
    },
    [clearAuthentication, loadSessionContext, queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await authApi.logoutAll();
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      authorization,
      login,
      logout,
      logoutAll,
      refreshCurrentUser,
      refreshAuthorization,
    }),
    [status, user, authorization, login, logout, logoutAll, refreshCurrentUser, refreshAuthorization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
