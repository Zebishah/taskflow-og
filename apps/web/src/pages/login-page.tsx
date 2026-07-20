import {
  useState,
  type FormEvent,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';

import { AuthLayout } from '../features/auth/components/auth-layout';
import { login } from '../features/auth/auth-api';
import { useAuth } from '../features/auth/use-auth';
import type {
  LoginInput,
} from '../features/auth/auth.types';
import { ApiError } from '../shared/api/api-error';
import { FormInput } from '../shared/components/form-input';

const initialForm: LoginInput = {
  email: '',
  password: '',
};

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    completeAuthentication,
  } = useAuth();

  const [form, setForm] =
    useState<LoginInput>(initialForm);

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: (response) => {
      completeAuthentication(response);
      navigate('/dashboard', {
        replace: true,
      });
    },
  });

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    loginMutation.mutate({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
  }

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? 'Unable to sign in. Please try again.'
        : null;

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue managing your TaskFlow workspace."
      footerText="Don’t have an account?"
      footerLinkText="Create one"
      footerLinkTo="/register"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        <FormInput
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              email: event.target.value,
            }));
          }}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          value={form.password}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              password: event.target.value,
            }));
          }}
        />

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="shine-button flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-600/25 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending
            ? 'Signing in...'
            : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
