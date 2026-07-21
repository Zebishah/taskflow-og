const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function getSafeReturnPath(
  candidate: string | null | undefined,
): string {
  if (!candidate) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return candidate;
}

export function createAuthPath(
  authPath: "/login" | "/register",
  returnTo: string,
): string {
  const searchParams = new URLSearchParams({
    returnTo: getSafeReturnPath(returnTo),
  });

  return `${authPath}?${searchParams.toString()}`;
}
