import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

function BrandMark(): React.JSX.Element {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-violet-500 shadow-lg shadow-violet-950/30">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 12 3 3 7-7" />
        <path d="M19 12a7 7 0 1 1-3.5-6.06" />
      </svg>
    </span>
  );
}

export function AuthLayout({
  children,
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps): React.JSX.Element {
  return (
    <main className="noise-overlay relative grid min-h-screen overflow-hidden bg-[#070a19] lg:grid-cols-[1.05fr_.95fr]">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-[100px]" />

      <section className="relative z-10 hidden min-h-screen overflow-hidden border-r border-white/[.07] px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-14">
        <div className="auth-grid absolute inset-0" />
        <div className="animate-float absolute right-[12%] top-[15%] h-32 w-32 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] blur-sm" />
        <div className="animate-float-delayed absolute bottom-[13%] right-[30%] h-20 w-20 rounded-3xl border border-violet-300/20 bg-violet-400/10 rotate-12" />

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 text-lg font-bold tracking-tight text-white">
          <BrandMark />
          <span>Task<span className="text-emerald-300">Flow</span></span>
        </Link>

        <div className="relative z-10 max-w-xl animate-fade-up">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
            Organize · Collaborate · Deliver
          </div>

          <h2 className="text-5xl font-semibold leading-[1.08] tracking-[-.045em] text-white xl:text-6xl">
            Turn busy work into
            <span className="mt-1 block bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">meaningful momentum.</span>
          </h2>

          <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300/80">
            A calm, focused workspace where your team can plan clearly, move faster, and celebrate every win together.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {['Live collaboration', 'Simple workflows', 'Secure by design'].map((feature) => (
              <span key={feature} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.055] px-3.5 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7" /></svg>
                {feature}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-slate-500">
          Thoughtfully built for modern teams.
        </p>
      </section>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[470px] animate-fade-up-delayed">
          <Link to="/" className="mb-9 flex w-fit items-center gap-3 text-lg font-bold tracking-tight text-white lg:hidden">
            <BrandMark />
            <span>Task<span className="text-emerald-300">Flow</span></span>
          </Link>

          <div className="rounded-[28px] border border-white/60 bg-white/[.97] p-6 shadow-[0_28px_90px_-28px_rgba(0,0,0,.8)] backdrop-blur-xl sm:p-9">
            <div className="mb-7 flex items-start justify-between gap-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-violet-600">Your workspace awaits</p>
                <h1 className="text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-[34px]">{title}</h1>
                <p className="mt-2.5 text-sm leading-6 text-slate-500">{description}</p>
              </div>
              <span className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:flex">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>
              </span>
            </div>

            {children}
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            {footerText}{' '}
            <Link to={footerLinkTo} className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200">
              {footerLinkText} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
