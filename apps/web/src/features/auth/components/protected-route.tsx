import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../use-auth';

export function ProtectedRoute(): React.JSX.Element {
  const {
    isAuthenticated,
    isInitializing,
  } = useAuth();

  if (isInitializing) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a19]">
        <div className="absolute h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />
        <div className="relative flex flex-col items-center gap-4 text-white">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
          </div>
          <span className="text-sm font-medium tracking-wide text-slate-300">
            Restoring your session...
          </span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}
