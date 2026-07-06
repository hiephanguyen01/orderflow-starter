type SessionExpiredListener = () => void;

let accessToken: string | null = null;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function subscribeToSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);

  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  clearAccessToken();

  for (const listener of sessionExpiredListeners) {
    listener();
  }
}

type AuthorizationChangedListener = () => void;

const authorizationChangedListeners = new Set<AuthorizationChangedListener>();

export function subscribeToAuthorizationChanged(listener: AuthorizationChangedListener): () => void {
  authorizationChangedListeners.add(listener);

  return () => {
    authorizationChangedListeners.delete(listener);
  };
}

export function notifyAuthorizationChanged(): void {
  for (const listener of authorizationChangedListeners) {
    listener();
  }
}
