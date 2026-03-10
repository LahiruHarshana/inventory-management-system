"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { api } from "@/lib/axios";

type ItemStatus = "In-Store" | "Borrowed" | "Damaged" | "Missing";

interface Place {
  id: number;
  name: string;
  cupboard?: {
    id: number;
    name: string;
  };
}

interface Item {
  id: number;
  name: string;
  code: string;
  total_quantity: number;
  available_quantity?: number;
  quantity?: number;
  image_path: string | null;
  status: ItemStatus;
  place_id: number;
  place: Place;
}

type PaginatedResponse<T> = {
  data: T[];
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const statusClassNames: Record<ItemStatus, string> = {
  "In-Store": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Borrowed: "border-amber-200 bg-amber-50 text-amber-700",
  Damaged: "border-rose-200 bg-rose-50 text-rose-700",
  Missing: "border-slate-300 bg-slate-100 text-slate-700",
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

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<PaginatedResponse<Item>>("/items");
      setItems(response.data.data);
    } catch (fetchError) {
      const message = formatErrorMessage(fetchError, "Unable to load inventory items right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const placeLabelMap = useMemo(() => {
    return new Map(
      items.map((item) => [
        item.id,
        item.place.cupboard ? `${item.place.cupboard.name} / ${item.place.name}` : item.place.name,
      ]),
    );
  }, [items]);

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
      await api.delete(`/items/${itemToDelete}`);
      await fetchItems();
      toast.success("Item deleted successfully");
      setIsConfirmOpen(false);
      setItemToDelete(null);
    } catch (deleteError) {
      const message = formatErrorMessage(deleteError, "Failed to delete item");
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Inventory Control
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Inventory Items
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-gray-500">
                Review item records, monitor storage assignments, and manage inventory status from a clean operational view.
              </p>
            </div>

            <Link
              href="/dashboard/items/add"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add New Item
            </Link>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                Items List
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {items.length} item{items.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              Loading items...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              No inventory items found. Add your first item to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Thumbnail
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Place Name
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item) => {
                    const isCurrentDeleteTarget = itemToDelete === item.id && isDeleting;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 sm:px-8">
                          {item.image_path ? (
                            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                              <Image
                                src={item.image_path}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-2xl border border-dashed border-gray-300 bg-gray-100" />
                          )}
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 sm:px-8">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          <span className="font-bold text-gray-900">
                            {item.available_quantity ?? item.quantity ?? item.total_quantity}
                          </span>{" "}
                          <span className="text-sm text-gray-500">
                            / {item.quantity ?? item.total_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassNames[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 sm:px-8">
                          {placeLabelMap.get(item.id) || item.place.name}
                        </td>
                        <td className="px-6 py-4 text-right sm:px-8">
                          <div className="flex justify-end gap-3">
                            <Link
                              href={`/dashboard/items/${item.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4"
                              >
                                <path
                                  d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="12" r="2.75" />
                              </svg>
                              View
                            </Link>
                            <Link
                              href={`/dashboard/items/${item.id}/edit`}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(item.id)}
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
        </section>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete inventory item"
        message="This action will permanently remove the item and its stored image from the system. This cannot be undone."
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={closeDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}