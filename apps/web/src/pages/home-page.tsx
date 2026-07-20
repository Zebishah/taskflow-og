import { useQuery } from '@tanstack/react-query';

import {
  getHealth,
  type HealthResponse,
} from '../shared/api/health-api';

export function HomePage(): React.JSX.Element {
  const healthQuery = useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
          TaskFlow Foundation
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          Frontend & Backend Connectivity
        </h1>

        <p className="mt-3 text-slate-600">
          This page verifies the complete connection between React,
          NestJS, Drizzle ORM, and PostgreSQL.
        </p>

        {/* Loading */}
        {healthQuery.isPending && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="font-medium text-blue-700">
                Checking application health...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {healthQuery.isError && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-semibold text-red-700">
              ❌ Connection Failed
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {healthQuery.error.message}
            </p>
          </div>
        )}

        {/* Success */}
        {healthQuery.data && (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                ✓
              </div>

              <div>
                <h2 className="text-lg font-semibold text-emerald-700">
                  Everything is running
                </h2>

                <p className="text-sm text-emerald-600">
                  All backend services are responding successfully.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  API
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {healthQuery.data.status}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Service
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {healthQuery.data.service}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Database
                </p>

                <p
                  className={`mt-2 text-lg font-semibold ${
                    healthQuery.data.database === 'connected'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {healthQuery.data.database}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}