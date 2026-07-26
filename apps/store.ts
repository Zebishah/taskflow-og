// // app/store.ts

// import { configureStore } from "@reduxjs/toolkit";
// import { setupListeners } from "@reduxjs/toolkit/query";

// import { authReducer } from "../features/auth/auth-slice";
// import { taskApi } from "../features/tasks/task-api";
// import { taskBoardReducer } from "../features/tasks/task-board-slice";

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     taskBoard: taskBoardReducer,

//     [taskApi.reducerPath]: taskApi.reducer,
//   },

//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware().concat(taskApi.middleware),
// });

// setupListeners(store.dispatch);

// export type RootState = ReturnType<typeof store.getState>;

// export type AppDispatch = typeof store.dispatch;
