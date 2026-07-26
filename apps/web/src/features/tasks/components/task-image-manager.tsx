import { useRef, useState, type ChangeEvent } from "react";

import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import {
  useDeleteTaskImageMutation,
  useTaskImageQuery,
  useUploadTaskImageMutation,
} from "../hooks/use-task-image";
import {
  allowedTaskImageTypes,
  maximumTaskImageBytes,
} from "../task-image.types";
import type { Task } from "../task.types";

interface TaskImageManagerProps {
  task: Task;
}

export function TaskImageManager({
  task,
}: TaskImageManagerProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const imageQuery = useTaskImageQuery(
    task.workspaceId,
    task.projectId,
    task.id,
    task.imageKey !== null,
  );

  const uploadMutation = useUploadTaskImageMutation();
  const deleteMutation = useDeleteTaskImageMutation();

  const image = uploadMutation.data ?? imageQuery.data;

  const operationError =
    uploadMutation.error ?? deleteMutation.error ?? imageQuery.error;

  const isPending = uploadMutation.isPending || deleteMutation.isPending;

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setValidationError(null);
    uploadMutation.reset();

    if (
      !allowedTaskImageTypes.includes(
        file.type as (typeof allowedTaskImageTypes)[number],
      )
    ) {
      setValidationError("Select a JPEG, PNG or WebP image.");
      return;
    }

    if (file.size > maximumTaskImageBytes) {
      setValidationError("Task images must be 5 MB or smaller.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        file,
      });
    } catch {
      // Mutation error is rendered below.
    }
  }

  async function removeImage(): Promise<void> {
    try {
      await deleteMutation.mutateAsync({
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
      });

      setConfirmingDelete(false);
    } catch {
      // Mutation error is rendered below.
    }
  }

  return (
    <section className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Task cover image
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            JPEG, PNG or WebP. Maximum size 5 MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isPending}
          onChange={(event) => {
            void handleFile(event);
          }}
          className="sr-only"
        />

        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadMutation.isPending
            ? "Uploading..."
            : image
              ? "Replace image"
              : "Upload image"}
        </button>
      </div>

      {imageQuery.isLoading && (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-slate-200" />
      )}

      {image && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src={image.downloadUrl}
            alt={image.originalName}
            className="h-48 w-full object-cover"
          />

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-700">
                {image.originalName}
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                {(image.sizeBytes / 1_024 / 1_024).toFixed(2)} MB
              </p>
            </div>

            {!confirmingDelete ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                Remove
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    void removeImage();
                  }}
                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {deleteMutation.isPending ? "Removing..." : "Confirm"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {validationError && (
        <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
          {validationError}
        </p>
      )}

      {operationError && (
        <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
          {getWorkspaceErrorMessage(operationError)}
        </p>
      )}
    </section>
  );
}
