export type AuthPrincipal = {
  userId: string;
  sessionId: string;
};

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
