import { createContext } from "react";

import type { AuthResponse, AuthUser } from "./auth.types";

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  completeAuthentication: (response: AuthResponse) => void;
  clearAuthentication: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
