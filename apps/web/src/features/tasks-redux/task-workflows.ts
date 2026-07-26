// import { createAsyncThunk } from "@reduxjs/toolkit";

// import { taskApi } from "./task-api";
// import type { CreateTaskArguments, UpdateTaskArguments } from "./task-api";
// import type { Task } from "./task.types";

// interface WorkflowThunkConfiguration {
//   rejectValue: string;
// }

// function getWorkflowErrorMessage(error: unknown, fallback: string): string {
//   if (error instanceof Error) {
//     return error.message;
//   }

//   return fallback;
// }

// export const createTaskWorkflowThunk = createAsyncThunk<
//   Task,
//   CreateTaskArguments,
//   WorkflowThunkConfiguration
// >(
//   "taskWorkflow/create",

//   async (arguments_, thunkApi) => {
//     try {
//       return await thunkApi
//         .dispatch(taskApi.endpoints.createTask.initiate(arguments_))
//         .unwrap();
//     } catch (error: unknown) {
//       return thunkApi.rejectWithValue(
//         getWorkflowErrorMessage(error, "Task could not be created"),
//       );
//     }
//   },
// );

// export const updateTaskWorkflowThunk = createAsyncThunk<
//   Task,
//   UpdateTaskArguments,
//   WorkflowThunkConfiguration
// >(
//   "taskWorkflow/update",

//   async (arguments_, thunkApi) => {
//     try {
//       return await thunkApi
//         .dispatch(taskApi.endpoints.updateTask.initiate(arguments_))
//         .unwrap();
//     } catch (error: unknown) {
//       return thunkApi.rejectWithValue(
//         getWorkflowErrorMessage(error, "Task could not be updated"),
//       );
//     }
//   },
// );
