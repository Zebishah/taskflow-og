import type { AuthResponse, AuthUser } from "./auth.types";

const ACCESS_TOKEN_KEY = "taskflow.accessToken";
const USER_KEY = "taskflow.user";

/*
 * Cross-origin Render deploy (web + api on different hosts) often
 * blocks third-party refresh cookies. Persist the access token in
 * sessionStorage so a normal page refresh stays signed in.
 */
export function persistAuthSession(response: AuthResponse): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function readPersistedAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function readPersistedUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearPersistedAuthSession(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
