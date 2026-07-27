import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "../../app/store";
import type { Project } from "./project.types";
import { isProjectArchived } from "./project.types";

export const selectProjectSearch = (state: RootState): string =>
  (state as unknown as { projectBrowser: { search: string } }).projectBrowser
    .search;

export const selectProjectFilter = (state: RootState) =>
  (state as unknown as { projectBrowser: { filter: string } }).projectBrowser
    .filter;

export const selectProjectView = (state: RootState) =>
  (state as unknown as { projectBrowser: { view: string } }).projectBrowser
    .view;

export const selectSelectedProjectId = (state: RootState): string | null =>
  (state as unknown as { projectBrowser: { selectedProjectId: string | null } })
    .projectBrowser.selectedProjectId;

export const selectVisibleProjects = createSelector(
  [
    (_state: RootState, projects: readonly Project[]) => projects,

    selectProjectSearch,
    selectProjectFilter,
  ],

  (projects, search, filter): Project[] => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const archived = isProjectArchived(project);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !archived) ||
        (filter === "archived" && archived);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.key.toLowerCase().includes(normalizedSearch) ||
        project.description?.toLowerCase().includes(normalizedSearch) === true;

      return matchesFilter && matchesSearch;
    });
  },
);
