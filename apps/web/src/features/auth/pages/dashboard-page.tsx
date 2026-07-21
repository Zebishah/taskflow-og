import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { logout } from "../auth-api";
import { useAuth } from "../use-auth";

function Logo(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-violet-600 text-white shadow-lg shadow-violet-600/20">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="m7 12 3 3 7-7" />
          <path d="M19 12a7 7 0 1 1-3.5-6.06" />
        </svg>
      </span>
      <div>
        <p className="font-bold tracking-tight text-slate-950">
          Task<span className="text-violet-600">Flow</span>
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">
          Workspace
        </p>
      </div>
    </div>
  );
}

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user, clearAuthentication } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: logout,

    onSettled: () => {
      clearAuthentication();

      navigate("/login", {
        replace: true,
      });
    },
  });

  if (!user) return <></>;

  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7fb] text-slate-800">
      <div className="pointer-events-none absolute -right-48 top-0 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute -left-48 bottom-0 h-[420px] w-[420px] rounded-full bg-emerald-200/30 blur-[120px]" />

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Logo />

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              All systems ready
            </div>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-emerald-100 text-xs font-bold text-violet-700 ring-2 ring-white shadow-sm">
                {initials}
              </span>
              <span className="hidden text-sm font-semibold text-slate-700 md:block">
                {user.firstName}
              </span>
            </div>
            <button
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="ml-1 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              </svg>
              <span className="hidden sm:inline">
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="animate-fade-up mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-violet-600">
              <span className="h-px w-7 bg-violet-500" /> Personal overview
            </div>
            <h1 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">
              Welcome back, {user.firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Your workspace is set up and ready for great work.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Session
              </p>
              <p className="text-sm font-semibold text-slate-700">Active now</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
          <section className="animate-fade-up-delayed relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#15152c] via-[#1c1640] to-[#29204e] p-7 text-white shadow-[0_28px_70px_-30px_rgba(55,38,125,.65)] sm:p-9">
            <div className="auth-grid absolute inset-0 opacity-50" />
            <div className="absolute -right-14 -top-20 h-60 w-60 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="absolute -bottom-16 right-1/3 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative z-10 flex h-full min-h-[285px] flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Workspace verified
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-white/20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 19V8m8 11V4m8 15v-7" />
                </svg>
              </div>
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-violet-300">
                  Your journey starts here
                </p>
                <h2 className="text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">
                  Everything is connected.
                  <br />
                  You’re ready to flow.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300/80">
                  Your account, secure session, and protected workspace are
                  working perfectly together.
                </p>
              </div>
            </div>
          </section>

          <section className="animate-fade-up-delayed rounded-[28px] border border-white bg-white/80 p-6 shadow-[0_18px_50px_-28px_rgba(30,41,59,.3)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">
                  Profile
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Account details
                </h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </span>
            </div>
            <div className="mt-7 space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Full name
                </p>
                <p className="mt-1.5 font-semibold text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Email address
                </p>
                <p className="mt-1.5 break-all text-sm font-semibold text-slate-800">
                  {user.email}
                </p>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Account status
                  </p>
                  <p className="mt-1.5 text-sm font-semibold capitalize text-slate-800">
                    {user.status}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                  Verified
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {[
            {
              color: "bg-violet-50 text-violet-600",
              title: "Authentication",
              text: "Identity confirmed",
              icon: "M9 12l2 2 4-4m5.6-4.4A11.9 11.9 0 0 1 12 3a11.9 11.9 0 0 1-8.6 2.6C3.1 6.7 3 7.8 3 9c0 5.6 3.8 10.3 9 12 5.2-1.7 9-6.4 9-12 0-1.2-.1-2.3-.4-3.4Z",
            },
            {
              color: "bg-emerald-50 text-emerald-600",
              title: "Database",
              text: "Securely connected",
              icon: "M20 6c0 1.7-3.6 3-8 3S4 7.7 4 6s3.6-3 8-3 8 1.3 8 3Zm0 0v6c0 1.7-3.6 3-8 3s-8-1.3-8-3V6m16 6v6c0 1.7-3.6 3-8 3s-8-1.3-8-3v-6",
            },
            {
              color: "bg-orange-50 text-orange-500",
              title: "Protected route",
              text: "Access is active",
              icon: "M12 15v2m-6 4h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm2-12V7a4 4 0 0 1 8 0v2",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group flex items-center gap-4 rounded-2xl border border-white bg-white/75 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${item.color}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{item.text}</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
