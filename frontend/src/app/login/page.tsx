"use client";

import { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

type LoginResponse = {
  token: string;
  user: unknown;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError<LaravelErrorResponse>) {
    const responseData = error.response?.data;
    const validationMessage = responseData?.errors
      ? Object.values(responseData.errors).flat().join(" ")
      : undefined;

    if (validationMessage) {
      return validationMessage;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }

    if (error.response?.status === 422) {
      return "Please check the entered details and try again.";
    }
  }

  return "Unable to sign in right now. Please try again.";
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post<LoginResponse>("/login", {
        email,
        password,
      });

      window.localStorage.setItem("token", data.token);
      window.localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(241,245,249,0.92)_42%,_rgba(226,232,240,0.88)_100%)] px-6 py-16">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.10),transparent_30%,rgba(15,23,42,0.08))]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[28px] border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-10">
        <div className="mb-8 space-y-3 text-center">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Inventory Management System
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Sign in to continue
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Access stock visibility, borrowing activity, and operational updates.
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
              placeholder="Enter your password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}