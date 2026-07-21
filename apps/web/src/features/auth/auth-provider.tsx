import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { refreshSession } from "./auth-api";
import { AuthContext } from "./auth-context";

import type { AuthResponse, AuthUser } from "./auth.types";

export function AuthProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  const completeAuthentication = useCallback(
    (response: AuthResponse): void => {
      /*
       * Cached API responses belong to the
       * previous authentication identity.
       */
      queryClient.clear();

      setUser(response.user);
      setAccessToken(response.accessToken);
    },
    [queryClient],
  );

  const clearAuthentication = useCallback((): void => {
    /*
     * Never allow another account to reuse
     * workspace/member/invitation data.
     */
    queryClient.clear();

    setUser(null);
    setAccessToken(null);
  }, [queryClient]);

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
  }, [clearAuthentication, completeAuthentication]);

  const contextValue = useMemo(
    () => ({
      user,
      accessToken,

      isAuthenticated: user !== null && accessToken !== null,

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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
