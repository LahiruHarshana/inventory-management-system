"use client";

import { useEffect, useState } from "react";

type StoredUser = {
  name: string;
  role?: string;
};

const readStoredUser = (): StoredUser | null => {
  const storedUser = window.localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as StoredUser;
  } catch {
    return null;
  }
};

export default function DashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:p-10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
            Operations Overview
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Monitor inventory health, track borrowing activity, and keep storage operations organized from one place.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Welcome</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            {user?.name ?? "Inventory Team"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Your workspace is ready for daily inventory operations and visibility.
          </p>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Your Role</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 capitalize">
            {user?.role ?? "user"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Access and navigation are tailored based on your assigned system permissions.
          </p>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">System Status</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            Ready
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Use the sidebar to move into items, cupboards, places, borrowings, and admin tools.
          </p>
        </article>
      </section>
    </div>
  );
}