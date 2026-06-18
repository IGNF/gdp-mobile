import type { AppUser } from '@/domain/user/models';

export interface AuthResult {
  success: boolean;
  user: AppUser | null;
  error?: Error;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
}

export interface RefreshResult {
  success: boolean;
  tokens?: AuthTokens;
  error?: Error;
}
