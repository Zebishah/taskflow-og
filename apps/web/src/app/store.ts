import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { taskflowApi } from "./taskflow-api";
import { projectBrowserReducer } from "../features/projects/project-browser.slice";

export const store = configureStore({
  reducer: {
    /*
     * RTK Query stores server responses here.
     */
    [taskflowApi.reducerPath]: taskflowApi.reducer,

    /*
     * Normal Redux slice for client-side UI state.
     */
    projectBrowser: projectBrowserReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(taskflowApi.middleware),
});

/*
 * Enables refetchOnFocus and refetchOnReconnect.
 */
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
