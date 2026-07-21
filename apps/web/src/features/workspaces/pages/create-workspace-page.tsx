import {
  useState,
  type FormEvent,
} from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useCreateWorkspaceMutation } from '../hooks/use-workspaces';
import { getWorkspaceErrorMessage } from '../workspace-api';

function generateSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateWorkspacePage(): React.JSX.Element {
  const navigate = useNavigate();
  const createMutation =
    useCreateWorkspaceMutation();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] =
    useState('');
  const [isSlugEdited, setIsSlugEdited] =
    useState(false);

  const normalizedName = name.trim();
  const normalizedSlug = slug.trim();

  const isFormValid =
    normalizedName.length >= 2 &&
    normalizedSlug.length >= 2 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      normalizedSlug,
    );

  function handleNameChange(
    value: string,
  ): void {
    setName(value);

    if (!isSlugEdited) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    try {
      const workspace =
        await createMutation.mutateAsync({
          name: normalizedName,
          slug: normalizedSlug,
          description:
            description.trim() || undefined,
        });

      navigate(`/workspaces/${workspace.id}`, {
        replace: true,
      });
    } catch {
      // Mutation error is rendered below.
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to="/workspaces"
        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-600"
      >
        <span aria-hidden="true">←</span>
        Back to workspaces
      </Link>

      <div className="grid overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_35px_100px_-55px_rgba(15,23,42,.5)] lg:grid-cols-[.82fr_1.18fr]">
        <aside className="relative overflow-hidden bg-[#0a0c20] p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-600/35 blur-[85px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[85px]" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              New collaboration space
            </span>

            <h1 className="mt-7 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Build a space where great work flows.
            </h1>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Your workspace will become the home for
              team members, projects, tasks, and shared
              decisions.
            </p>

            <div className="mt-9 space-y-4">
              {[
                'Invite and organize your team',
                'Create focused projects',
                'Keep work securely separated',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                    ✓
                  </span>

                  {item}
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                Preview
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-bold">
                  {normalizedName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) =>
                      word[0]?.toUpperCase(),
                    )
                    .join('') || 'NW'}
                </span>

                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {normalizedName ||
                      'New Workspace'}
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    /
                    {normalizedSlug ||
                      'workspace-slug'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-violet-600">
            Workspace details
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Create your workspace
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            You’ll become the workspace owner and can
            invite your team next.
          </p>

          <form
            onSubmit={(event) =>
              void handleSubmit(event)
            }
            className="mt-9 space-y-6"
          >
            <div>
              <label
                htmlFor="workspace-name"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Workspace name
              </label>

              <input
                id="workspace-name"
                type="text"
                value={name}
                maxLength={100}
                autoFocus
                placeholder="TaskFlow Engineering"
                onChange={(event) =>
                  handleNameChange(
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Use your team, department, or company
                name.
              </p>
            </div>

            <div>
              <label
                htmlFor="workspace-slug"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Workspace URL
              </label>

              <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                <span className="flex items-center border-r border-slate-200 px-4 text-sm text-slate-400">
                  taskflow/
                </span>

                <input
                  id="workspace-slug"
                  type="text"
                  value={slug}
                  maxLength={100}
                  placeholder="taskflow-engineering"
                  onChange={(event) => {
                    setIsSlugEdited(true);
                    setSlug(
                      generateSlug(
                        event.target.value,
                      ),
                    );
                  }}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>

              {normalizedSlug &&
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                  normalizedSlug,
                ) && (
                  <p className="mt-2 text-xs font-medium text-rose-600">
                    Use lowercase letters, numbers,
                    and single hyphens.
                  </p>
                )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="workspace-description"
                  className="text-sm font-semibold text-slate-800"
                >
                  Description
                </label>

                <span className="text-xs text-slate-400">
                  {description.length}/1000
                </span>
              </div>

              <textarea
                id="workspace-description"
                value={description}
                maxLength={1000}
                rows={5}
                placeholder="What will your team organize in this workspace?"
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {createMutation.isError && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
              >
                {getWorkspaceErrorMessage(
                  createMutation.error,
                )}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/workspaces"
                className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  !isFormValid ||
                  createMutation.isPending
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {createMutation.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}

                {createMutation.isPending
                  ? 'Creating workspace...'
                  : 'Create workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}