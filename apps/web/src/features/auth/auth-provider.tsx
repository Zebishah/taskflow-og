import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAppDispatch } from "../../app/redux-hooks";
import { taskflowApi } from "../../app/taskflow-api";
import { projectBrowserReset } from "../projects/project-browser.slice";
import { refreshSession } from "./auth-api";
import { AuthContext } from "./auth-context";
import type { AuthResponse, AuthUser } from "./auth.types";

export function AuthProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const queryClient = useQueryClient();

  const dispatch = useAppDispatch();

  const [user, setUser] = useState<AuthUser | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  const clearApplicationCaches = useCallback((): void => {
    /*
     * Clear features that still use TanStack Query.
     */
    queryClient.clear();

    /*
     * Clear workspace/project RTK Query data.
     *
     * This prevents the next account from seeing
     * cached data belonging to the previous account.
     */
    dispatch(taskflowApi.util.resetApiState());

    /*
     * Clear client-side project browser preferences.
     */
    dispatch(projectBrowserReset());
  }, [dispatch, queryClient]);

  const completeAuthentication = useCallback(
    (response: AuthResponse): void => {
      clearApplicationCaches();

      setUser(response.user);
      setAccessToken(response.accessToken);
    },
    [clearApplicationCaches],
  );

  const clearAuthentication = useCallback((): void => {
    clearApplicationCaches();

    setUser(null);
    setAccessToken(null);
  }, [clearApplicationCaches]);

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
