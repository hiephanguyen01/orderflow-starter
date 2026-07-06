export type AccessTokenPayload = {
  sub: string;
  sid: string;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  jti: string;
  type: 'refresh';
};

export type AuthPrincipal = {
  userId: string;
  sessionId: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
};

export type AuthenticationResult = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;

  refreshToken: string;
  refreshTokenExpiresAt: Date;

  user: AuthenticatedUser;
};

export type RefreshResult = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;

  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type ClientContext = {
  ipAddress: string | null;
  userAgent: string | null;
};
