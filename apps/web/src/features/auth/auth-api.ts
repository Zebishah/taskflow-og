import { createApiError } from "../../shared/api/api-error";
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from "./auth.types";

const AUTH_BASE_URL = "/api/v1/auth";

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return request<AuthResponse>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshSession(): Promise<AuthResponse> {
  return request<AuthResponse>(`${AUTH_BASE_URL}/refresh`, {
    method: "POST",
  });
}

export function logout(): Promise<void> {
  return request<void>(`${AUTH_BASE_URL}/logout`, {
    method: "POST",
  });
}

export function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>(`${AUTH_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
