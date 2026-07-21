import type { PublicUser } from '../users/users.types';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}

export interface RefreshTokenData {
  sessionId: string;
  secret: string;
}

export interface CreatedSession {
  refreshToken: string;
  expiresAt: Date;
}
