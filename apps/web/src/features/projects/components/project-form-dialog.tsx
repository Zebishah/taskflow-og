import { useEffect, useRef, useState, type FormEvent } from "react";

import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import type { CreateProjectInput, Project } from "../project.types";

interface ProjectFormDialogProps {
  project?: Project;
  isPending: boolean;
  error: unknown;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  name?: string;
  key?: string;
  description?: string;
}

export function ProjectFormDialog({
  project,
  isPending,
  error,
  onSubmit,
  onClose,
}: ProjectFormDialogProps): React.JSX.Element | null {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(project?.name ?? "");

  const [key, setKey] = useState(project?.key ?? "");

  const [description, setDescription] = useState(project?.description ?? "");

  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = project !== undefined;

  useEffect(() => {
    nameInputRef.current?.focus();

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = originalOverflow;
    };
  }, [isPending, onClose]);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    const normalizedName = name.trim();
    const normalizedKey = key.trim().toUpperCase();
    const normalizedDescription = description.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      nextErrors.name = "Project name must contain 2–100 characters.";
    }

    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(normalizedKey)) {
      nextErrors.key =
        "Use 2–10 uppercase letters or numbers, starting with a letter.";
    }

    if (normalizedDescription.length > 1000) {
      nextErrors.description = "Description cannot exceed 1,000 characters.";
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
      });
    } catch {
      // Mutation error is displayed below.
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close project dialog"
        disabled={isPending}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl animate-[fade-up_.25s_ease-out_both] sm:p-8"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
              Project workspace
            </span>

            <h2
              id="project-form-title"
              className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-slate-950"
            >
              {isEditing ? "Edit project" : "Create a project"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isEditing
                ? "Update the project information used by your team."
                : "Create a focused place for your team’s upcoming tasks."}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            aria-label="Close"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="project-name"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Project name
            </label>

            <input
              ref={nameInputRef}
              id="project-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              placeholder="Website Redesign"
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({
                  ...current,
                  name: undefined,
                }));
              }}
              className={[
                "w-full rounded-2xl border bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition focus:bg-white focus:ring-4",
                errors.name
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
              ].join(" ")}
            />

            {errors.name && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="project-key"
                className="text-sm font-semibold text-slate-800"
              >
                Project key
              </label>

              <span className="text-xs text-slate-400">
                Used later for WEB-1
              </span>
            </div>

            <input
              id="project-key"
              type="text"
              required
              minLength={2}
              maxLength={10}
              value={key}
              placeholder="WEB"
              onChange={(event) => {
                setKey(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );

                setErrors((current) => ({
                  ...current,
                  key: undefined,
                }));
              }}
              className={[
                "w-full rounded-2xl border bg-slate-50/70 px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider outline-none transition focus:bg-white focus:ring-4",
                errors.key
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
              ].join(" ")}
            />

            {errors.key && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.key}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="project-description"
                className="text-sm font-semibold text-slate-800"
              >
                Description
              </label>

              <span className="text-xs text-slate-400">
                {description.length}/1000
              </span>
            </div>

            <textarea
              id="project-description"
              rows={5}
              maxLength={1000}
              value={description}
              placeholder="What is this project trying to achieve?"
              onChange={(event) => {
                setDescription(event.target.value);

                setErrors((current) => ({
                  ...current,
                  description: undefined,
                }));
              }}
              className={[
                "w-full resize-none rounded-2xl border bg-slate-50/70 px-4 py-3.5 text-sm leading-6 outline-none transition focus:bg-white focus:ring-4",
                errors.description
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
              ].join(" ")}
            />

            {errors.description && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.description}
              </p>
            )}
          </div>

          {Boolean(error) && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {getWorkspaceErrorMessage(error)}
            </div>
          )}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {isPending
                ? "Saving project..."
                : isEditing
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
