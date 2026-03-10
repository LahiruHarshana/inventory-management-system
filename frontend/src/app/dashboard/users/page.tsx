"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

type UserRole = "admin" | "staff";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

type UsersResponse = {
  data?: User[];
  users?: User[];
};

type CreateUserResponse = {
  message: string;
  user: User;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type StoredUser = {
  name: string;
  role?: string;
};

type CreateUserFormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const defaultFormState: CreateUserFormState = {
  name: "",
  email: "",
  password: "",
  role: "staff",
};

const roleClassNames: Record<UserRole, string> = {
  admin: "border-sky-200 bg-sky-50 text-sky-800",
  staff: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const formatErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<LaravelErrorResponse>;
    const validationMessage = axiosError.response?.data?.errors
      ? Object.values(axiosError.response.data.errors).flat().join(" ")
      : undefined;

    return validationMessage || axiosError.response?.data?.message || fallback;
  }

  return fallback;
};

const readStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

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

const formatDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CreateUserModal = ({
  isOpen,
  form,
  formError,
  isSaving,
  onClose,
  onSubmit,
  onChange,
}: {
  isOpen: boolean;
  form: CreateUserFormState;
  formError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof CreateUserFormState, value: string) => void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              User Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Create User
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Create a new internal account and assign the appropriate system role.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create user modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6 18 18" strokeLinecap="round" />
              <path d="M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form className="space-y-8 px-6 py-6 sm:px-8 sm:py-8" onSubmit={onSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="user-name" className="text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="user-name"
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Nadeesha Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="nadeesha@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="user-role" className="text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) => onChange("role", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              >
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="user-password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="user-password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => onChange("password", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<CreateUserFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStoredUser(readStoredUser());
  }, []);

  const isAdmin = useMemo(() => storedUser?.role === "admin", [storedUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<User[] | UsersResponse>("/users");
      const responseData = response.data;

      if (Array.isArray(responseData)) {
        setUsers(responseData);
      } else if (Array.isArray(responseData.data)) {
        setUsers(responseData.data);
      } else if (Array.isArray(responseData.users)) {
        setUsers(responseData.users);
      } else {
        setUsers([]);
      }
    } catch (fetchError) {
      const message = formatErrorMessage(fetchError, "Unable to load users right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const openCreateModal = () => {
    if (!isAdmin) {
      toast.error("Only admins can create users.");
      return;
    }

    setForm(defaultFormState);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSaving) {
      return;
    }

    setIsCreateModalOpen(false);
    setForm(defaultFormState);
    setFormError(null);
  };

  const updateForm = (field: keyof CreateUserFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value as CreateUserFormState[keyof CreateUserFormState] }));
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      const message = "Only admins can create users.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);
      setError(null);

      await api.post<CreateUserResponse>("/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      toast.success("User created successfully");
      closeCreateModal();
      await fetchUsers();
    } catch (submitError) {
      const message = formatErrorMessage(submitError, "Unable to create the user.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Administration
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                User Management
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-500">
                Manage internal access, review assigned roles, and create new user accounts for authorized staff.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create User
            </button>
          </div>
        </section>

        {!isAdmin ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Only administrators can create users and assign roles.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Users List
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {users.length} user{users.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              No users available to display.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80">
                      <td className="px-6 py-4 sm:px-8">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                        <Link href={`mailto:${user.email}`} className="transition hover:text-slate-900">
                          {user.email}
                        </Link>
                      </td>
                      <td className="px-6 py-4 sm:px-8">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase ${roleClassNames[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        form={form}
        formError={formError}
        isSaving={isSaving}
        onClose={closeCreateModal}
        onSubmit={handleCreateUser}
        onChange={updateForm}
      />
    </>
  );
}