// import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// import {
//   createTaskWorkflowThunk,
//   updateTaskWorkflowThunk,
// } from "./task-workflows";
// import type { TaskPriority } from "./task.types";

// type TaskBoardView = "board" | "list";

// type WorkflowStatus = "idle" | "loading" | "succeeded" | "failed";

// interface TaskFilters {
//   search: string;
//   priority: TaskPriority | "all";
//   assigneeMemberId: string | null;
// }

// interface TaskBoardState {
//   view: TaskBoardView;
//   selectedTaskId: string | null;
//   filters: TaskFilters;

//   createStatus: WorkflowStatus;
//   createError: string | null;

//   updateStatus: WorkflowStatus;
//   updateError: string | null;
// }

// const initialState: TaskBoardState = {
//   view: "board",
//   selectedTaskId: null,

//   filters: {
//     search: "",
//     priority: "all",
//     assigneeMemberId: null,
//   },

//   createStatus: "idle",
//   createError: null,

//   updateStatus: "idle",
//   updateError: null,
// };

// const taskBoardSlice = createSlice({
//   name: "taskBoard",

//   initialState,

//   reducers: {
//     viewChanged(state, action: PayloadAction<TaskBoardView>) {
//       state.view = action.payload;
//     },

//     taskSelected(state, action: PayloadAction<string | null>) {
//       state.selectedTaskId = action.payload;
//     },

//     searchChanged(state, action: PayloadAction<string>) {
//       state.filters.search = action.payload;
//     },

//     priorityFilterChanged(state, action: PayloadAction<TaskPriority | "all">) {
//       state.filters.priority = action.payload;
//     },

//     filtersCleared(state) {
//       state.filters = {
//         ...initialState.filters,
//       };
//     },

//     workflowErrorsCleared(state) {
//       state.createError = null;
//       state.updateError = null;
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       .addCase(createTaskWorkflowThunk.pending, (state) => {
//         state.createStatus = "loading";
//         state.createError = null;
//       })

//       .addCase(createTaskWorkflowThunk.fulfilled, (state, action) => {
//         state.createStatus = "succeeded";

//         /*
//          * The task itself stays in RTK Query cache.
//          * This slice stores only its selected ID.
//          */
//         state.selectedTaskId = action.payload.id;
//       })

//       .addCase(createTaskWorkflowThunk.rejected, (state, action) => {
//         state.createStatus = "failed";

//         state.createError =
//           action.payload ?? action.error.message ?? "Task could not be created";
//       })

//       .addCase(updateTaskWorkflowThunk.pending, (state) => {
//         state.updateStatus = "loading";
//         state.updateError = null;
//       })

//       .addCase(updateTaskWorkflowThunk.fulfilled, (state, action) => {
//         state.updateStatus = "succeeded";
//         state.selectedTaskId = action.payload.id;
//       })

//       .addCase(updateTaskWorkflowThunk.rejected, (state, action) => {
//         state.updateStatus = "failed";

//         state.updateError =
//           action.payload ?? action.error.message ?? "Task could not be updated";
//       });
//   },
// });

// export const {
//   viewChanged,
//   taskSelected,
//   searchChanged,
//   priorityFilterChanged,
//   filtersCleared,
//   workflowErrorsCleared,
// } = taskBoardSlice.actions;

// export const taskBoardReducer = taskBoardSlice.reducer;
