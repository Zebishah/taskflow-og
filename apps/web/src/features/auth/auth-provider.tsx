import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { refreshSession } from './auth-api';
import { AuthContext } from './auth-context';
import type {
  AuthResponse,
  AuthUser,
} from './auth.types';

export function AuthProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const completeAuthentication = useCallback(
    (response: AuthResponse): void => {
      setUser(response.user);
      setAccessToken(response.accessToken);
    },
    [],
  );

  const clearAuthentication =
    useCallback((): void => {
      setUser(null);
      setAccessToken(null);
    }, []);

  useEffect(() => {
    let isActive = true;

    async function initializeAuthentication(): Promise<void> {
      try {
        const response = await refreshSession();

        if (isActive) {
          completeAuthentication(response);
        }
      } catch {
        if (isActive) {
          clearAuthentication();
        }
      } finally {
        if (isActive) {
          setIsInitializing(false);
        }
      }
    }

    void initializeAuthentication();

    return () => {
      isActive = false;
    };
  }, [
    clearAuthentication,
    completeAuthentication,
  ]);

  const contextValue = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated:
        user !== null && accessToken !== null,
      isInitializing,
      completeAuthentication,
      clearAuthentication,
    }),
    [
      accessToken,
      clearAuthentication,
      completeAuthentication,
      isInitializing,
      user,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}