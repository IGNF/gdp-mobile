import { createContext } from 'react';

import type { AuthResult } from '@/domain/auth/models';
import type { AppUser } from '@/domain/user/models';
import type { LogoutResult } from '@/infra/auth/authService';

export interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOAuth: () => Promise<AuthResult>;
  setUserFromOAuthCallback: (user: AppUser) => Promise<void>;
  logout: () => Promise<LogoutResult>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
