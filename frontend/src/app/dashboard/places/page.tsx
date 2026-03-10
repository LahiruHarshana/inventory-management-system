"use client";

import { AxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";
import ConfirmModal from "@/components/ConfirmModal";

interface Cupboard {
  id: number;
  name: string;
}

interface Place {
  id: number;
  cupboard_id: number;
  name: string;
  created_at: string;
  cupboard: Cupboard;
}

type PaginatedResponse<T> = {
  data: T[];
};

type PlaceMutationResponse = {
  message: string;
  data: Place;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type PlaceFormState = {
  name: string;
  cupboard_id: string;
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

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [cupboards, setCupboards] = useState<Cupboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cupboardId, setCupboardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editForm, setEditForm] = useState<PlaceFormState>({
    name: "",
    cupboard_id: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [placesResponse, cupboardsResponse] = await Promise.all([
        api.get<PaginatedResponse<Place>>("/places"),
        api.get<PaginatedResponse<Cupboard>>("/cupboards"),
      ]);

      setPlaces(placesResponse.data.data);
      setCupboards(cupboardsResponse.data.data);
    } catch (fetchError) {
      const message = getErrorMessage(fetchError, "Unable to load places right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPageData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setCreateError(null);
      setError(null);

      await api.post<PlaceMutationResponse>("/places", {
        name,
        cupboard_id: Number(cupboardId),
      });

      setName("");
      setCupboardId("");
      await fetchPageData();
      toast.success("Place added successfully");
    } catch (submitError) {
      const message = getErrorMessage(submitError, "Unable to create the place.");
      setCreateError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (place: Place) => {
    setEditingPlace(place);
    setEditForm({
      name: place.name,
      cupboard_id: String(place.cupboard_id),
    });
    setEditError(null);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingPlace) {
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      setError(null);

      await api.put<PlaceMutationResponse>(`/places/${editingPlace.id}`, {
        name: editForm.name,
        cupboard_id: Number(editForm.cupboard_id),
      });

      setEditingPlace(null);
      setEditForm({ name: "", cupboard_id: "" });
      await fetchPageData();
      toast.success("Place updated successfully");
    } catch (updateError) {
      const message = getErrorMessage(updateError, "Unable to update the place.");
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

    setEditingPlace(null);
    setEditForm({ name: "", cupboard_id: "" });
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
      await api.delete(`/places/${itemToDelete}`);
      await fetchPageData();
      toast.success("Place deleted successfully");
      setIsConfirmOpen(false);
      setItemToDelete(null);
    } catch (deleteError) {
      const message = getErrorMessage(deleteError, "Failed to delete place");
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
              Places
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              Define storage places within cupboards so inventory locations stay structured, searchable, and operationally clear.
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
                Create Place
              </h2>
              <p className="text-sm leading-6 text-gray-500">
                Add a new place and assign it to a cupboard for precise physical storage tracking.
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
                  placeholder="Shelf A1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cupboard_id" className="text-sm font-medium text-gray-700">
                  Cupboard
                </label>
                <select
                  id="cupboard_id"
                  value={cupboardId}
                  onChange={(event) => setCupboardId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                >
                  <option value="">Select a cupboard</option>
                  {cupboards.map((cupboard) => (
                    <option key={cupboard.id} value={cupboard.id}>
                      {cupboard.name}
                    </option>
                  ))}
                </select>
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
                {isSubmitting ? "Saving..." : "Create Place"}
              </button>
            </form>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Places List
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {places.length} place{places.length === 1 ? "" : "s"} available
                </p>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
                Loading places...
              </div>
            ) : places.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
                No places found. Create your first place to get started.
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
                        Cupboard
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
                    {places.map((place) => {
                      const isCurrentDeleteTarget = itemToDelete === place.id && isDeleting;

                      return (
                        <tr key={place.id} className="hover:bg-gray-50/80">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 sm:px-8">
                            #{place.id}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 sm:px-8">
                            {place.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 sm:px-8">
                            {place.cupboard.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 sm:px-8">
                            {formatDate(place.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right sm:px-8">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleEditClick(place)}
                                disabled={isCurrentDeleteTarget}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(place.id)}
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

      {editingPlace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Edit Place
                </h2>
                <p className="text-sm leading-6 text-gray-500">
                  Update the place name or assign it to a different cupboard.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdating}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close edit place modal"
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
                <label htmlFor="edit-cupboard_id" className="text-sm font-medium text-gray-700">
                  Cupboard
                </label>
                <select
                  id="edit-cupboard_id"
                  value={editForm.cupboard_id}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      cupboard_id: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                >
                  <option value="">Select a cupboard</option>
                  {cupboards.map((cupboard) => (
                    <option key={cupboard.id} value={cupboard.id}>
                      {cupboard.name}
                    </option>
                  ))}
                </select>
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
        title="Delete place"
        message="This action will permanently remove the place from the system. This cannot be undone."
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={closeDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}