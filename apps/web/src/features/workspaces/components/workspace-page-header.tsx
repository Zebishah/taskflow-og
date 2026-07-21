import { Link } from 'react-router-dom';

interface WorkspacePageHeaderProps {
  workspaceId: string;
  workspaceName: string;
  title: string;
  description: string;
}

export function WorkspacePageHeader({
  workspaceId,
  workspaceName,
  title,
  description,
}: WorkspacePageHeaderProps): React.JSX.Element {
  return (
    <header className="mb-8 animate-[fade-up_.5s_ease-out_both]">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link
          to="/workspaces"
          className="transition-colors hover:text-violet-600"
        >
          Workspaces
        </Link>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m8 5 5 5-5 5" />
        </svg>

        <Link
          to={`/workspaces/${workspaceId}`}
          className="max-w-52 truncate transition-colors hover:text-violet-600"
        >
          {workspaceName}
        </Link>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m8 5 5 5-5 5" />
        </svg>

        <span className="font-medium text-slate-900">
          {title}
        </span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
        {description}
      </p>
    </header>
  );
}