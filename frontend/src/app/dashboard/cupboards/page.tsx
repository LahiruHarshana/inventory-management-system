"use client";

import { AxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";
import ConfirmModal from "@/components/ConfirmModal";

interface Cupboard {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

type CupboardsResponse = {
  data: Cupboard[];
};

type CupboardMutationResponse = {
  message: string;
  data: Cupboard;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type CupboardFormState = {
  name: string;
  description: string;
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<LaravelErrorResponse>;
    const validationMessage = axiosError.response?.data?.errors
      ? Object.values(axiosError.response.data.errors).flat().join(" ")
      : undefined;

    return validationMessage || axiosError.response?.data?.message || fallback;
  }

  return fallback;
};

export default function CupboardsPage() {
  const [cupboards, setCupboards] = useState<Cupboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCupboard, setEditingCupboard] = useState<Cupboard | null>(null);
  const [editForm, setEditForm] = useState<CupboardFormState>({
    name: "",
    description: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCupboards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<CupboardsResponse>("/cupboards");
      setCupboards(response.data.data);
    } catch (fetchError) {
      const message = getErrorMessage(fetchError, "Unable to load cupboards right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCupboards();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setCreateError(null);
      setError(null);

      await api.post<CupboardMutationResponse>("/cupboards", {
        name,
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      await fetchCupboards();
      toast.success("Cupboard added successfully");
    } catch (submitError) {
      const message = getErrorMessage(submitError, "Unable to create the cupboard.");
      setCreateError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (cupboard: Cupboard) => {
    setEditingCupboard(cupboard);
    setEditForm({
      name: cupboard.name,
      description: cupboard.description ?? "",
    });
    setEditError(null);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingCupboard) {
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      setError(null);

      await api.put<CupboardMutationResponse>(`/cupboards/${editingCupboard.id}`, {
        name: editForm.name,
        description: editForm.description.trim() || null,
      });

      setEditingCupboard(null);
      setEditForm({ name: "", description: "" });
      await fetchCupboards();
      toast.success("Cupboard updated successfully");
    } catch (updateError) {
      const message = getErrorMessage(updateError, "Unable to update the cupboard.");
      setEditError(message);
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeEditModal = () => {
    if (isUpdating) {
      return;
    }

    setEditingCupboard(null);
    setEditForm({ name: "", description: "" });
    setEditError(null);
  };

  const openDeleteConfirm = (id: number) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) {
      return;
    }

    setIsConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete === null) {
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);
      await api.delete(`/cupboards/${itemToDelete}`);
      await fetchCupboards();
      toast.success("Cupboard deleted successfully");
      setIsConfirmOpen(false);
      setItemToDelete(null);
    } catch (deleteError) {
      const message = getErrorMessage(deleteError, "Failed to delete cupboard");
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-3 rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Storage Management
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Cupboards
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              Create and manage cupboard records used to organize physical storage across your inventory locations.
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)]">
          <article className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Create Cupboard
              </h2>
              <p className="text-sm leading-6 text-gray-500">
                Add a new cupboard to the system for assigning places and tracking stored inventory.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="Main archive cupboard"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="Optional notes about cupboard usage, floor, or location."
                />
              </div>

              {createError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {createError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Saving..." : "Create Cupboard"}
              </button>
            </form>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Cupboards List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {cupboards.length} cupboard{cupboards.length === 1 ? "" : "s"} available
                </p>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
                Loading cupboards...
              </div>
            ) : cupboards.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
                No cupboards found. Create your first cupboard to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                        Created Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cupboards.map((cupboard) => {
                      const isCurrentDeleteTarget = itemToDelete === cupboard.id && isDeleting;

                      return (
                        <tr key={cupboard.id} className="hover:bg-gray-50/80">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 sm:px-8">
                            #{cupboard.id}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 sm:px-8">
                            {cupboard.name}
                          </td>
                          <td className="px-6 py-4 text-sm leading-6 text-gray-500 sm:px-8">
                            {cupboard.description || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 sm:px-8">
                            {formatDate(cupboard.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right sm:px-8">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditClick(cupboard)}
                                disabled={isCurrentDeleteTarget}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(cupboard.id)}
                                disabled={isCurrentDeleteTarget}
                                className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isCurrentDeleteTarget ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </div>

      {editingCupboard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Edit Cupboard
                </h2>
                <p className="text-sm leading-6 text-gray-500">
                  Update cupboard details and keep storage records accurate.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdating}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close edit cupboard modal"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-32 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="Optional notes about cupboard usage, floor, or location."
                />
              </div>

              {editError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete cupboard"
        message="This action will permanently remove the cupboard from the system. This cannot be undone."
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={closeDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}