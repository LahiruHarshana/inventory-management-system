"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

interface Item {
  id: number;
  name: string;
  code: string;
  available_quantity?: number;
  quantity?: number;
  total_quantity?: number;
}

type PaginatedResponse<T> = {
  data: T[];
};

type BorrowingMutationResponse = {
  message: string;
  data: unknown;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type BorrowingFormState = {
  item_id: string;
  borrower_name: string;
  contact_details: string;
  borrow_date: string;
  expected_return_date: string;
  borrowed_qty: string;
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const defaultFormState: BorrowingFormState = {
  item_id: "",
  borrower_name: "",
  contact_details: "",
  borrow_date: getToday(),
  expected_return_date: getToday(),
  borrowed_qty: "1",
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

export default function NewBorrowingPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<BorrowingFormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setPageError(null);

        const response = await api.get<PaginatedResponse<Item>>("/items");
        setItems(response.data.data);
      } catch (fetchError) {
        const message = formatErrorMessage(fetchError, "Unable to load inventory items right now.");
        setPageError(message);
        toast.error(message);
      } finally {
        setLoadingItems(false);
      }
    };

    void fetchItems();
  }, []);

  const availableItems = useMemo(() => {
    return items.filter((item) => {
      const stock = item.available_quantity ?? item.quantity ?? 0;
      return stock > 0;
    });
  }, [items]);

  const selectedItem = useMemo(() => {
    const selectedId = Number(form.item_id);

    if (!selectedId) {
      return null;
    }

    return availableItems.find((item) => item.id === selectedId) ?? null;
  }, [availableItems, form.item_id]);

  const selectedItemAvailableQuantity = selectedItem?.available_quantity ?? selectedItem?.quantity ?? 0;

  const updateForm = (field: keyof BorrowingFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError(null);
      setPageError(null);

      await api.post<BorrowingMutationResponse>("/borrowings", {
        item_id: Number(form.item_id),
        borrower_name: form.borrower_name,
        contact_details: form.contact_details,
        borrow_date: form.borrow_date,
        expected_return_date: form.expected_return_date,
        borrowed_qty: Number(form.borrowed_qty),
      });

      toast.success("Item borrowed successfully");
      router.push("/dashboard/borrowings");
      router.refresh();
    } catch (submitError) {
      const message = formatErrorMessage(submitError, "Unable to create the borrowing record.");
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
            href="/dashboard/borrowings"
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
            Back to Borrowings
          </Link>

          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Borrowing System
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              New Borrowing
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-gray-500">
              Issue inventory with a controlled borrowing record, validated stock quantity, and clearly scheduled return expectations.
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
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="borrowing-item" className="text-sm font-medium text-gray-700">
                Select Item
              </label>
              <select
                id="borrowing-item"
                value={form.item_id}
                onChange={(event) => updateForm("item_id", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                disabled={loadingItems || availableItems.length === 0}
                required
              >
                <option value="">
                  {loadingItems ? "Loading items..." : "Select an available item"}
                </option>
                {availableItems.map((item) => {
                  const availableQuantity = item.available_quantity ?? item.quantity ?? 0;

                  return (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code}) - {availableQuantity} available
                    </option>
                  );
                })}
              </select>
              {selectedItem ? (
                <p className="text-xs text-gray-500">
                  Available stock for this item: {selectedItemAvailableQuantity}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="borrower-name" className="text-sm font-medium text-gray-700">
                Borrower Name
              </label>
              <input
                id="borrower-name"
                type="text"
                value={form.borrower_name}
                onChange={(event) => updateForm("borrower_name", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Kamal Perera"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-details" className="text-sm font-medium text-gray-700">
                Contact Details
              </label>
              <input
                id="contact-details"
                type="text"
                value={form.contact_details}
                onChange={(event) => updateForm("contact_details", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="077 123 4567 or kamal@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="borrow-date" className="text-sm font-medium text-gray-700">
                Borrow Date
              </label>
              <input
                id="borrow-date"
                type="date"
                value={form.borrow_date}
                onChange={(event) => updateForm("borrow_date", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expected-return-date" className="text-sm font-medium text-gray-700">
                Expected Return Date
              </label>
              <input
                id="expected-return-date"
                type="date"
                value={form.expected_return_date}
                onChange={(event) => updateForm("expected_return_date", event.target.value)}
                min={form.borrow_date}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="borrowed-qty" className="text-sm font-medium text-gray-700">
                Quantity to Borrow
              </label>
              <input
                id="borrowed-qty"
                type="number"
                min="1"
                max={selectedItemAvailableQuantity || undefined}
                value={form.borrowed_qty}
                onChange={(event) => updateForm("borrowed_qty", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              />
              <p className="text-xs text-gray-500">
                Enter a quantity that does not exceed currently available stock.
              </p>
            </div>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/borrowings"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || loadingItems || availableItems.length === 0}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Saving..." : "Save Borrowing"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}