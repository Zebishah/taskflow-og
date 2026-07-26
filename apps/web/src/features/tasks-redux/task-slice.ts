// import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// import { createTaskThunk, fetchTasksThunk } from "./task-thunks";
// import type { Task } from "./task.types";

// export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

// interface TasksState {
//   items: Task[];
//   fetchStatus: RequestStatus;
//   createStatus: RequestStatus;
//   fetchError: string | null;
//   createError: string | null;
// }

// const initialState: TasksState = {
//   items: [],
//   fetchStatus: "idle",
//   createStatus: "idle",
//   fetchError: null,
//   createError: null,
// };

// const tasksSlice = createSlice({
//   name: "tasks",

//   initialState,

//   reducers: {
//     clearCreateError(state) {
//       state.createError = null;
//     },

//     clearTasks(state) {
//       state.items = [];
//       state.fetchStatus = "idle";
//       state.fetchError = null;
//     },

//     taskUpdatedLocally(state, action: PayloadAction<Task>) {
//       const taskIndex = state.items.findIndex(
//         (task) => task.id === action.payload.id,
//       );

//       if (taskIndex !== -1) {
//         state.items[taskIndex] = action.payload;
//       }
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTasksThunk.pending, (state) => {
//         state.fetchStatus = "loading";
//         state.fetchError = null;
//       })

//       .addCase(fetchTasksThunk.fulfilled, (state, action) => {
//         state.fetchStatus = "succeeded";
//         state.items = action.payload;
//       })

//       .addCase(fetchTasksThunk.rejected, (state, action) => {
//         state.fetchStatus = "failed";

//         state.fetchError =
//           action.payload ?? action.error.message ?? "Tasks could not be loaded";
//       })

//       .addCase(createTaskThunk.pending, (state) => {
//         state.createStatus = "loading";
//         state.createError = null;
//       })

//       .addCase(createTaskThunk.fulfilled, (state, action) => {
//         state.createStatus = "succeeded";
//         state.items.push(action.payload);
//       })

//       .addCase(createTaskThunk.rejected, (state, action) => {
//         state.createStatus = "failed";

//         state.createError =
//           action.payload ?? action.error.message ?? "Task could not be created";
//       });
//   },
// });

// export const { clearCreateError, clearTasks, taskUpdatedLocally } =
//   tasksSlice.actions;

// export const tasksReducer = tasksSlice.reducer;
