export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type CurrentUserRole = {
  id: string;
  code: string;
  name: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  createdAt?: string;
  roles?: CurrentUserRole[];
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  user: CurrentUser;
};

export type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
};

export type LogoutAllResponse = {
  success: boolean;
  revokedSessionCount: number;
};

export type CurrentAuthorization = {
  permissionCodes: string[];
  isSuperAdmin: boolean;
  authorizationVersion: number;
};

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';
