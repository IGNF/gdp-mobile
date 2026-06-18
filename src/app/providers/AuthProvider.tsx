import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { AuthContext } from './AuthContext';
import type { AppUser } from '@/domain/user/models';
import * as authService from '@/infra/auth';
import * as userStorage from '@/infra/storage/UserStorage';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function tryRestoreSession() {
      try {
        const sessionRestored = await authService.restoreSession();
        if (!sessionRestored) {
          await userStorage.clearUser();
          return;
        }

        const refreshedUser = await authService.fetchCurrentUser();
        if (refreshedUser.success && refreshedUser.user) {
          await userStorage.saveUser(refreshedUser.user);
          setUser(refreshedUser.user);
          return;
        }

        const storedUser = await userStorage.getUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch {
        await userStorage.clearUser();
      } finally {
        setIsLoading(false);
      }
    }

    void tryRestoreSession();
  }, []);

  const loginWithOAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authService.loginWithOAuth();
      if (result.success && result.user) {
        await userStorage.saveUser(result.user);
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserFromOAuthCallback = useCallback(async (nextUser: AppUser) => {
    await userStorage.saveUser(nextUser);
    setUser(nextUser);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const result = await authService.fetchCurrentUser({ forceRefresh: true });
    if (result.success && result.user) {
      await userStorage.saveUser(result.user);
      setUser(result.user);
      return result.user;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      await userStorage.clearAll();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithOAuth,
        setUserFromOAuthCallback,
        refreshCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
