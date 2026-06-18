import { createContext } from 'react';

import type { AuthResult } from '@/domain/auth/models';
import type { AppUser } from '@/domain/user/models';

export interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOAuth: () => Promise<AuthResult>;
  setUserFromOAuthCallback: (user: AppUser) => Promise<void>;
  refreshCurrentUser: () => Promise<AppUser | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
