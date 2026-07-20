import { useQuery } from '@tanstack/react-query';

import { getHealth, type HealthResponse } from '../shared/api/health-api';

export function HomePage(): React.JSX.Element {
  const healthQuery = useQuery<HealthResponse, Error>({ queryKey: ['health'], queryFn: getHealth });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7fb] px-5 py-12">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-200/50 blur-[100px]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/50 blur-[100px]" />
      <section className="animate-fade-up relative z-10 w-full max-w-3xl overflow-hidden rounded-[30px] border border-white bg-white/85 p-6 shadow-[0_30px_80px_-35px_rgba(30,41,59,.35)] backdrop-blur-xl sm:p-10">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl from-violet-100 to-transparent" />
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-violet-600"><span className="h-px w-7 bg-violet-500" /> TaskFlow foundation</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">Your technology, working beautifully together.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">A live view of the connection between React, NestJS, Drizzle ORM, and PostgreSQL.</p>

        {healthQuery.isPending && <div className="mt-8 flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-5 text-violet-700"><div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"/><span className="text-sm font-semibold">Checking application health...</span></div>}

        {healthQuery.isError && <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">!</span><div><h2 className="font-semibold text-rose-800">Connection unavailable</h2><p className="mt-0.5 text-sm text-rose-600">{healthQuery.error.message}</p></div></div></div>}

        {healthQuery.data && <div className="mt-8">
          <div className="mb-5 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">✓</span><div><h2 className="font-semibold text-emerald-900">Everything is running</h2><p className="mt-0.5 text-sm text-emerald-700">All backend services are responding successfully.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['API', healthQuery.data.status, 'violet'], ['Service', healthQuery.data.service, 'orange'], ['Database', healthQuery.data.database, 'emerald']].map(([label, value, color]) => <div key={label} className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"><div className={`mb-4 h-2 w-8 rounded-full ${color === 'violet' ? 'bg-violet-500' : color === 'orange' ? 'bg-orange-400' : 'bg-emerald-500'}`}/><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 break-all text-sm font-semibold capitalize text-slate-900">{value}</p></div>)}
          </div>
        </div>}
      </section>
    </main>
  );
}
