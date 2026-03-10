"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
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
  serial_number: string | null;
  description: string | null;
  image_path: string | null;
  status: ItemStatus;
  place_id: number;
  place: Place;
}

type ItemResponse = {
  data: Item;
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

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-gray-900">{value}</p>
    </div>
  );
};

export default function ViewItemPage() {
  const params = useParams();
  const rawId = params.id;
  const itemId = useMemo(() => {
    if (typeof rawId === "string") {
      return rawId;
    }

    if (Array.isArray(rawId) && rawId[0]) {
      return rawId[0];
    }

    return null;
  }, [rawId]);

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      const message = "Invalid item id.";
      setError(message);
      setLoading(false);
      toast.error(message);
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ItemResponse>(`/items/${itemId}`);
        setItem(response.data.data);
      } catch (fetchError) {
        const message = formatErrorMessage(fetchError, "Unable to load item details right now.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchItem();
  }, [itemId]);

  const placeLabel = item?.place
    ? item.place.cupboard
      ? `${item.place.cupboard.name} / ${item.place.name}`
      : item.place.name
    : "-";

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/dashboard/items"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Items
            </Link>

            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Inventory Control
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {loading ? "Loading Item" : item?.name ?? "Item Details"}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-500">
                Review the complete inventory record, image reference, storage assignment, and operational status in a dedicated read-only view.
              </p>
            </div>
          </div>

          <Link
            href={itemId ? `/dashboard/items/${itemId}/edit` : "/dashboard/items"}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit Item
          </Link>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[32px] border border-gray-200 bg-white px-6 py-20 text-center text-sm text-gray-500 shadow-sm sm:px-8">
          Loading item details...
        </section>
      ) : error ? (
        <section className="rounded-[32px] border border-rose-200 bg-rose-50 px-6 py-12 text-sm text-rose-700 shadow-sm sm:px-8">
          <p className="font-semibold">Unable to display this item.</p>
          <p className="mt-2">{error}</p>
        </section>
      ) : item ? (
        <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[420px,minmax(0,1fr)]">
            <div className="border-b border-gray-200 bg-gradient-to-br from-slate-100 via-white to-slate-50 p-6 sm:p-8 xl:border-b-0 xl:border-r">
              <div className="flex h-full flex-col gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Item Image
                  </p>
                  <p className="text-sm leading-6 text-gray-500">
                    Visual reference for quick identification during audits and daily operations.
                  </p>
                </div>

                {item.image_path ? (
                  <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                    <Image
                      src={item.image_path}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 100vw, 420px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-8 w-8"
                      >
                        <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" />
                        <path d="m7.5 15 3.2-3.2a1.5 1.5 0 0 1 2.121 0L16.5 15.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="9" r="1.25" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-700">No image available</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                      This inventory record does not currently include an image attachment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 xl:p-10">
              <div className="flex flex-col gap-6 border-b border-gray-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{item.name}</h2>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassNames[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-gray-500">
                    Item code <span className="font-semibold text-gray-700">{item.code}</span>
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Available Quantity
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                    {item.available_quantity ?? item.quantity ?? item.total_quantity}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <DetailField label="Name" value={item.name} />
                <DetailField label="Code" value={item.code} />
                <DetailField label="Serial Number" value={item.serial_number || "Not provided"} />
                <DetailField label="Stored Place" value={placeLabel} />
                <DetailField label="Status" value={item.status} />
                <DetailField
                  label="Available Quantity"
                  value={String(item.available_quantity ?? item.quantity ?? item.total_quantity)}
                />
                <DetailField
                  label="Total Quantity"
                  value={String(item.quantity ?? item.total_quantity)}
                />
              </div>

              <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Description
                </p>
                <div className="mt-4 rounded-2xl bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm">
                  {item.description ? item.description : "No description provided for this inventory item."}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}