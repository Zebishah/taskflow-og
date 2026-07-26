// import { createAsyncThunk } from "@reduxjs/toolkit";

// import type {
//   AuthenticatedTaskLocation,
//   CreateTaskArguments,
//   Task,
// } from "./task.types";
// import { createTask, getTasks } from "../tasks/task-api";

// interface ThunkConfiguration {
//   rejectValue: string;
// }

// function getUnknownErrorMessage(error: unknown): string {
//   return error instanceof Error
//     ? error.message
//     : "An unexpected error occurred";
// }

// export const fetchTasksThunk = createAsyncThunk<
//   Task[],
//   AuthenticatedTaskLocation,
//   ThunkConfiguration
// >(
//   "tasks/fetchAll",

//   async ({ workspaceId, projectId, accessToken }, thunkApi) => {
//     try {
//       return await getTasks(
//         {
//           workspaceId,
//           projectId,
//         },
//         accessToken,
//         thunkApi.signal,
//       );
//     } catch (error: unknown) {
//       return thunkApi.rejectWithValue(getUnknownErrorMessage(error));
//     }
//   },
// );

// export const createTaskThunk = createAsyncThunk<
//   Task,
//   CreateTaskArguments,
//   ThunkConfiguration
// >(
//   "tasks/create",

//   async ({ workspaceId, projectId, accessToken, input }, thunkApi) => {
//     try {
//       return await createTask(
//         {
//           workspaceId,
//           projectId,
//         },
//         input,
//         accessToken,
//         thunkApi.signal,
//       );
//     } catch (error: unknown) {
//       return thunkApi.rejectWithValue(getUnknownErrorMessage(error));
//     }
//   },
// );
