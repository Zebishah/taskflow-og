import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ProjectFilter } from "./project.types";

export type ProjectBrowserView = "grid" | "list";

interface ProjectBrowserState {
  search: string;
  filter: ProjectFilter;
  view: ProjectBrowserView;
  selectedProjectId: string | null;
}

const initialState: ProjectBrowserState = {
  search: "",
  filter: "active",
  view: "grid",
  selectedProjectId: null,
};

const projectBrowserSlice = createSlice({
  name: "projectBrowser",

  initialState,

  reducers: {
    projectSearchChanged(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },

    projectFilterChanged(state, action: PayloadAction<ProjectFilter>) {
      state.filter = action.payload;
    },

    projectViewChanged(state, action: PayloadAction<ProjectBrowserView>) {
      state.view = action.payload;
    },

    projectSelected(state, action: PayloadAction<string | null>) {
      state.selectedProjectId = action.payload;
    },

    projectBrowserReset() {
      return initialState;
    },
  },
});

export const {
  projectSearchChanged,
  projectFilterChanged,
  projectViewChanged,
  projectSelected,
  projectBrowserReset,
} = projectBrowserSlice.actions;

export const projectBrowserReducer = projectBrowserSlice.reducer;
