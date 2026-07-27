import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export const taskflowApi = createApi({
  reducerPath: "taskflowApi",

  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl.replace(/\/+$/, ""),

    credentials: "include",

    prepareHeaders(headers) {
      headers.set("accept", "application/json");

      return headers;
    },
  }),

  tagTypes: ["Workspace", "Project"],

  /*
   * Keep unused results for five minutes.
   *
   * If the user leaves Workspace A and returns
   * within five minutes, its cached projects can
   * be rendered immediately.
   */
  keepUnusedDataFor: 5 * 60,

  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: () => ({}),
});
