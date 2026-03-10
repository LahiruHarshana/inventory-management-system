"use client";

import { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  serial_number: string | null;
  description: string | null;
  image_path: string | null;
  status: ItemStatus;
  place_id: number;
  place: Place;
}

type PaginatedResponse<T> = {
  data: T[];
};

type ItemResponse = {
  data: Item;
};

type ItemMutationResponse = {
  message: string;
  data: Item;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type ItemFormState = {
  name: string;
  code: string;
  total_quantity: string;
  serial_number: string;
  description: string;
  place_id: string;
  status: ItemStatus;
  image: File | null;
};

const defaultFormState: ItemFormState = {
  name: "",
  code: "",
  total_quantity: "1",
  serial_number: "",
  description: "",
  place_id: "",
  status: "In-Store",
  image: null,
};

const itemStatuses: ItemStatus[] = ["In-Store", "Borrowed", "Damaged", "Missing"];

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

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
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

  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(defaultFormState);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!itemId) {
      const message = "Invalid item id.";
      setPageError(message);
      toast.error(message);
      return;
    }

    const fetchPageData = async () => {
      try {
        setLoadingPage(true);
        setPageError(null);

        const [itemResponse, placesResponse] = await Promise.all([
          api.get<ItemResponse>(`/items/${itemId}`),
          api.get<PaginatedResponse<Place>>("/places"),
        ]);

        const item = itemResponse.data.data;

        setPlaces(placesResponse.data.data);
        setForm({
          name: item.name,
          code: item.code,
          total_quantity: String(item.total_quantity),
          serial_number: item.serial_number ?? "",
          description: item.description ?? "",
          place_id: String(item.place_id),
          status: item.status,
          image: null,
        });
        setExistingImage(item.image_path);
      } catch (fetchError) {
        const message = formatErrorMessage(fetchError, "Unable to load item details right now.");
        setPageError(message);
        toast.error(message);
      } finally {
        setLoadingPage(false);
      }
    };

    void fetchPageData();
  }, [itemId]);

  const updateForm = (
    field: Exclude<keyof ItemFormState, "image">,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setForm((current) => ({ ...current, image: file }));

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const currentPreview = imagePreview || existingImage;

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("_method", "PUT");
    formData.append("name", form.name);
    formData.append("code", form.code);
    formData.append("total_quantity", form.total_quantity);
    formData.append("serial_number", form.serial_number);
    formData.append("description", form.description);
    formData.append("place_id", form.place_id);
    formData.append("status", form.status);

    if (form.image) {
      formData.append("image", form.image);
    }

    return formData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!itemId) {
      const message = "Invalid item id.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      setPageError(null);

      const formData = buildFormData();

      await api.post<ItemMutationResponse>(`/items/${itemId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Item updated successfully");
      router.push("/dashboard/items");
      router.refresh();
    } catch (submitError) {
      const message = formatErrorMessage(submitError, "Unable to update the item.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
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
              Edit Item
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-gray-500">
              Update operational details, storage assignment, lifecycle status, and image records for this inventory item.
            </p>
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8 xl:p-10">
        {loadingPage ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading item details...</div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="item-name" className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="item-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="Dell Latitude 5440"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-code" className="text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  id="item-code"
                  type="text"
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="LTP-0001"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-quantity" className="text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={form.total_quantity}
                  onChange={(event) => updateForm("total_quantity", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-serial-number" className="text-sm font-medium text-gray-700">
                  Serial Number
                </label>
                <input
                  id="item-serial-number"
                  type="text"
                  value={form.serial_number}
                  onChange={(event) => updateForm("serial_number", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="SN-458823"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="item-place" className="text-sm font-medium text-gray-700">
                  Stored Place
                </label>
                <select
                  id="item-place"
                  value={form.place_id}
                  onChange={(event) => updateForm("place_id", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                >
                  <option value="">Select a place</option>
                  {places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.cupboard ? `${place.cupboard.name} / ` : ""}
                      {place.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="item-status" className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="item-status"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  required
                >
                  {itemStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="item-description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="item-description"
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                className="min-h-36 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Optional internal notes, purchase details, or maintenance remarks."
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),220px]">
              <div className="space-y-3">
                {currentPreview ? (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Current Image</span>
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                      <Image
                        src={currentPreview}
                        alt="Item preview"
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="item-image" className="text-sm font-medium text-gray-700">
                    Image
                  </label>
                  <input
                    id="item-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  <p className="text-xs text-gray-500">
                    Upload a new image only if you want to replace the existing one.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Preview</span>
                {currentPreview ? (
                  <div className="relative h-44 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                    <Image
                      src={currentPreview}
                      alt="Selected item preview"
                      fill
                      className="object-cover"
                      sizes="220px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            {formError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/items"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}