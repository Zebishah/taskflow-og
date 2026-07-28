import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { WorkspacePageHeader } from "../components/workspace-page-header";
import {
  useDeleteWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useWorkspaceQuery,
} from "../hooks/use-workspaces";
import { getWorkspaceErrorMessage } from "../workspace-api";

function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function WorkspaceSettingsPage(): React.JSX.Element {
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();

  const navigate = useNavigate();

  const workspaceQuery = useWorkspaceQuery(workspaceId);

  const updateMutation = useUpdateWorkspaceMutation();

  const deleteMutation = useDeleteWorkspaceMutation();

  const [draft, setDraft] = useState<{
    name?: string;
    slug?: string;
    description?: string;
  }>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (workspaceQuery.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-60 rounded bg-slate-200" />
        <div className="mt-8 h-96 rounded-[28px] border border-slate-200 bg-white" />
      </div>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data || !workspaceId) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-8 text-center">
        <p className="text-sm text-rose-700">
          {getWorkspaceErrorMessage(workspaceQuery.error)}
        </p>
      </div>
    );
  }

  const workspace = workspaceQuery.data;

  const name = draft.name ?? workspace.name;
  const slug = draft.slug ?? workspace.slug;
  const description = draft.description ?? workspace.description ?? "";

  if (workspace.role !== "owner") {
    return <Navigate to={`/workspaces/${workspace.id}`} replace />;
  }

  const normalizedName = name.trim();
  const normalizedSlug = slug.trim();

  const hasChanges =
    normalizedName !== workspace.name ||
    normalizedSlug !== workspace.slug ||
    description.trim() !== (workspace.description ?? "");

  const isFormValid =
    normalizedName.length >= 2 &&
    normalizedSlug.length >= 2 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug);

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!isFormValid || !hasChanges) {
      return;
    }

    setIsSaved(false);

    try {
      await updateMutation.mutateAsync({
        workspaceId: workspace.id,
        input: {
          name: normalizedName,
          slug: normalizedSlug,
          description: description.trim(),
        },
      });

      setIsSaved(true);

      window.setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch {
      // Mutation error is rendered below.
    }
  }

  async function handleDelete(): Promise<void> {
    if (deleteConfirmation !== workspace.name) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(workspace.id);

      navigate("/workspaces", {
        replace: true,
      });
    } catch {
      // Mutation error is rendered below.
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <WorkspacePageHeader
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        title="Workspace settings"
        description="Manage your workspace identity and destructive actions."
      />

      <form
        onSubmit={(event) => void handleUpdate(event)}
        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="border-b border-slate-100 pb-6">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
            General information
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Update how this workspace appears to its members.
          </p>
        </div>

        <div className="mt-7 grid gap-6">
          <div>
            <label
              htmlFor="settings-name"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Workspace name
            </label>

            <input
              id="settings-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="settings-slug"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Workspace slug
            </label>

            <input
              id="settings-slug"
              type="text"
              value={slug}
              maxLength={100}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  slug: generateSlug(event.target.value),
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="settings-description"
                className="text-sm font-semibold text-slate-800"
              >
                Description
              </label>

              <span className="text-xs text-slate-400">
                {description.length}/1000
              </span>
            </div>

            <textarea
              id="settings-description"
              value={description}
              maxLength={1000}
              rows={5}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-6 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>

        {updateMutation.isError && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getWorkspaceErrorMessage(updateMutation.error)}
          </div>
        )}

        {isSaved && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Workspace settings saved successfully.
          </div>
        )}

        <div className="mt-7 flex justify-end border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={!hasChanges || !isFormValid || updateMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {updateMutation.isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <section className="mt-7 overflow-hidden rounded-[28px] border border-rose-200 bg-white">
        <div className="border-b border-rose-100 bg-rose-50/70 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-rose-950">Danger zone</h2>

          <p className="mt-2 text-sm leading-6 text-rose-700/75">
            Deleting a workspace is permanent. Its membership records and future
            workspace data will be removed.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <label
            htmlFor="delete-confirmation"
            className="block text-sm font-semibold text-slate-800"
          >
            Type{" "}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              {workspace.name}
            </span>{" "}
            to confirm
          </label>

          <input
            id="delete-confirmation"
            type="text"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-rose-200 bg-rose-50/30 px-4 py-3.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
          />

          {deleteMutation.isError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getWorkspaceErrorMessage(deleteMutation.error)}
            </div>
          )}

          <button
            type="button"
            disabled={
              deleteConfirmation !== workspace.name || deleteMutation.isPending
            }
            onClick={() => void handleDelete()}
            className="mt-5 flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleteMutation.isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {deleteMutation.isPending
              ? "Deleting workspace..."
              : "Delete workspace permanently"}
          </button>
        </div>
      </section>
    </section>
  );
}
