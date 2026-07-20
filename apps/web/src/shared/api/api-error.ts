import type { ApiErrorResponse } from "../../features/auth/auth.types";

export class ApiError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export async function createApiError(response: Response): Promise<ApiError> {
  let errorBody: ApiErrorResponse;

  try {
    errorBody = (await response.json()) as ApiErrorResponse;
  } catch {
    return new ApiError("An unexpected server error occurred", response.status);
  }

  const message = Array.isArray(errorBody.message)
    ? errorBody.message.join(", ")
    : errorBody.message;

  return new ApiError(message || "Request failed", response.status);
}
