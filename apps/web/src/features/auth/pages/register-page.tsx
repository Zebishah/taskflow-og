import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { register } from "../auth-api";
import { AuthLayout } from "../components/auth-layout";
import type { RegisterInput } from "../auth.types";
import { useAuth } from "../use-auth";
import { ApiError } from "../../../shared/api/api-error";
import { FormInput } from "../../../shared/components/form-input";
import { getSafeReturnPath } from "../../../shared/routing/return-path";

interface RegisterForm extends RegisterInput {
  confirmPassword: string;
}

const initialForm: RegisterForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnTo = getSafeReturnPath(searchParams.get("returnTo"));
  const { isAuthenticated, completeAuthentication } = useAuth();

  const [form, setForm] = useState<RegisterForm>(initialForm);

  const [formError, setFormError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: register,

    onSuccess: (response) => {
      completeAuthentication(response);

      navigate(returnTo, {
        replace: true,
      });
    },
  });

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormError(null);

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    registerMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
  }

  const requestError =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.isError
        ? "Unable to create your account."
        : null;

  const errorMessage = formError ?? requestError;

  return (
    <AuthLayout
      title="Create your account"
      description="Start organizing projects and collaborating with your team."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo={`/login?${new URLSearchParams({
        returnTo,
      }).toString()}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            id="firstName"
            label="First name"
            type="text"
            autoComplete="given-name"
            placeholder="Miyabi"
            required
            maxLength={100}
            value={form.firstName}
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                firstName: event.target.value,
              }));
            }}
          />

          <FormInput
            id="lastName"
            label="Last name"
            type="text"
            autoComplete="family-name"
            placeholder="Nagumo"
            required
            maxLength={100}
            value={form.lastName}
            onChange={(event) => {
              setForm((currentForm) => ({
                ...currentForm,
                lastName: event.target.value,
              }));
            }}
          />
        </div>

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
          autoComplete="new-password"
          placeholder="At least 10 characters"
          required
          minLength={10}
          maxLength={72}
          value={form.password}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              password: event.target.value,
            }));
          }}
        />

        <FormInput
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          minLength={10}
          maxLength={72}
          value={form.confirmPassword}
          onChange={(event) => {
            setForm((currentForm) => ({
              ...currentForm,
              confirmPassword: event.target.value,
            }));
          }}
        />

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="shine-button flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-600/25 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {registerMutation.isPending
            ? "Creating account..."
            : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
