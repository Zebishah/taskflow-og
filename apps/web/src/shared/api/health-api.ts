import { apiClient } from "./api-client";

export interface HealthResponse {
  status: "done";
  service: "taskflow-api";
  database: "connected";
  redis: "connected";
  timestamp: string;
}
export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/health");

  return response.data;
}
