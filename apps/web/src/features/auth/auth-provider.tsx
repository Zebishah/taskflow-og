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
import { getCurrentUser, refreshSession } from "./auth-api";
import { AuthContext } from "./auth-context";
import {
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAccessToken,
} from "./auth-session-storage";
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
    queryClient.clear();
    dispatch(taskflowApi.util.resetApiState());
    dispatch(projectBrowserReset());
  }, [dispatch, queryClient]);

  const completeAuthentication = useCallback(
    (response: AuthResponse): void => {
      clearApplicationCaches();
      persistAuthSession(response);
      setUser(response.user);
      setAccessToken(response.accessToken);
    },
    [clearApplicationCaches],
  );

  const clearAuthentication = useCallback((): void => {
    clearApplicationCaches();
    clearPersistedAuthSession();
    setUser(null);
    setAccessToken(null);
  }, [clearApplicationCaches]);

  useEffect(() => {
    let isActive = true;

    async function initializeAuthentication(): Promise<void> {
      try {
        /*
         * Prefer cookie refresh when the browser allows cross-site cookies.
         */
        try {
          const refreshed = await refreshSession();

          if (isActive) {
            completeAuthentication(refreshed);
          }

          return;
        } catch {
          /*
           * Fall through to sessionStorage restore when refresh cookies
           * are blocked (common for web.onrender.com → api.onrender.com).
           */
        }

        const storedToken = readPersistedAccessToken();

        if (!storedToken) {
          if (isActive) {
            clearAuthentication();
          }

          return;
        }

        try {
          const currentUser = await getCurrentUser(storedToken);

          if (isActive) {
            completeAuthentication({
              user: currentUser,
              accessToken: storedToken,
            });
          }
        } catch {
          if (isActive) {
            clearAuthentication();
          }
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
