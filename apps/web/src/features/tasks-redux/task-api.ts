// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// import type { RootState } from "../../app/store";
// import type { CreateTaskInput, Task, UpdateTaskInput } from "./task.types";

// export interface ProjectLocation {
//   workspaceId: string;
//   projectId: string;
// }

// export interface CreateTaskArguments extends ProjectLocation {
//   input: CreateTaskInput;
// }

// export interface UpdateTaskArguments extends ProjectLocation {
//   taskId: string;
//   input: UpdateTaskInput;
// }

// function getTaskPath({ workspaceId, projectId }: ProjectLocation): string {
//   return `/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`;
// }

// export const taskApi = createApi({
//   reducerPath: "taskApi",

//   baseQuery: fetchBaseQuery({
//     baseUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000/api/v1",

//     prepareHeaders: (headers, { getState }) => {
//       const state = getState() as RootState;
//       const accessToken = state.auth.accessToken;

//       if (accessToken) {
//         headers.set("authorization", `Bearer ${accessToken}`);
//       }

//       return headers;
//     },
//   }),

//   tagTypes: ["Task"],

//   endpoints: (builder) => ({
//     getTasks: builder.query<Task[], ProjectLocation>({
//       query: (location) => ({
//         url: getTaskPath(location),
//         method: "GET",
//       }),

//       providesTags: (tasks, _error, arguments_) => [
//         {
//           type: "Task",
//           id: `LIST-${arguments_.projectId}`,
//         },

//         ...(tasks?.map((task) => ({
//           type: "Task" as const,
//           id: task.id,
//         })) ?? []),
//       ],
//     }),

//     createTask: builder.mutation<Task, CreateTaskArguments>({
//       query: ({ input, ...location }) => ({
//         url: getTaskPath(location),
//         method: "POST",
//         body: input,
//       }),

//       invalidatesTags: (_result, _error, arguments_) => [
//         {
//           type: "Task",
//           id: `LIST-${arguments_.projectId}`,
//         },
//       ],
//     }),

//     updateTask: builder.mutation<Task, UpdateTaskArguments>({
//       query: ({ taskId, input, ...location }) => ({
//         url: `${getTaskPath(location)}/${taskId}`,
//         method: "PATCH",
//         body: input,
//       }),

//       invalidatesTags: (_result, _error, arguments_) => [
//         {
//           type: "Task",
//           id: arguments_.taskId,
//         },

//         {
//           type: "Task",
//           id: `LIST-${arguments_.projectId}`,
//         },
//       ],
//     }),
//   }),
// });

// export const { useGetTasksQuery } = taskApi;
