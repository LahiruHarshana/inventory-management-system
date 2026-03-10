"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { api } from "@/lib/axios";

type BorrowingStatus = "Active" | "Returned";

interface BorrowingItem {
  id: number;
  name: string;
  code: string;
}

interface Borrowing {
  id: number;
  borrower_name: string;
  contact_details: string;
  borrowed_qty: number;
  borrow_date: string;
  expected_return_date: string;
  returned_date: string | null;
  status: BorrowingStatus;
  item: BorrowingItem;
}

type PaginatedResponse<T> = {
  data: T[];
};

type BorrowingMutationResponse = {
  message: string;
  data: Borrowing;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const statusClassNames: Record<BorrowingStatus, string> = {
  Active: "border-amber-200 bg-amber-50 text-amber-700",
  Returned: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

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

export default function BorrowingsPage() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<PaginatedResponse<Borrowing>>("/borrowings");
      setBorrowings(response.data.data);
    } catch (fetchError) {
      const message = formatErrorMessage(fetchError, "Unable to load borrowings right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBorrowings();
  }, []);

  const openReturnConfirm = (borrowing: Borrowing) => {
    setSelectedBorrowing(borrowing);
    setIsConfirmOpen(true);
  };

  const closeReturnConfirm = () => {
    if (isSubmittingReturn) {
      return;
    }

    setIsConfirmOpen(false);
    setSelectedBorrowing(null);
  };

  const handleReturnConfirm = async () => {
    if (!selectedBorrowing) {
      return;
    }

    try {
      setIsSubmittingReturn(true);
      setError(null);

      await api.post<BorrowingMutationResponse>(`/borrowings/${selectedBorrowing.id}/return`);

      toast.success("Item returned successfully");
      setIsConfirmOpen(false);
      setSelectedBorrowing(null);
      await fetchBorrowings();
    } catch (returnError) {
      const message = formatErrorMessage(returnError, "Unable to process this return right now.");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Borrowing System
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Borrowings
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-500">
                Track issued inventory, expected returns, and current borrowing activity from a focused operational ledger.
              </p>
            </div>

            <Link
              href="/dashboard/borrowings/new"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              New Borrowing
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
                Borrowing Records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {borrowings.length} record{borrowings.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              Loading borrowing records...
            </div>
          ) : borrowings.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              No borrowing records found. Create the first borrowing to start tracking issued items.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Borrower Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Item Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Qty Borrowed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Borrow Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Expected Return
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {borrowings.map((borrowing) => {
                    const isCurrentReturnTarget =
                      selectedBorrowing?.id === borrowing.id && isSubmittingReturn;

                    return (
                      <tr key={borrowing.id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 sm:px-8">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {borrowing.borrower_name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {borrowing.contact_details}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {borrowing.item?.name || "Unknown Item"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {borrowing.item?.code || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          {borrowing.borrowed_qty}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          {formatDate(borrowing.borrow_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          {formatDate(borrowing.expected_return_date)}
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassNames[borrowing.status]}`}
                          >
                            {borrowing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right sm:px-8">
                          {borrowing.status !== "Returned" ? (
                            <button
                              type="button"
                              onClick={() => openReturnConfirm(borrowing)}
                              disabled={isCurrentReturnTarget}
                              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isCurrentReturnTarget ? "Processing..." : "Mark as Returned"}
                            </button>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Completed</span>
                          )}
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
        title="Mark borrowing as returned"
        message={selectedBorrowing
          ? `This will return ${selectedBorrowing.borrowed_qty} unit(s) of ${selectedBorrowing.item?.name || "the selected item"} to available stock.`
          : "This will return the selected borrowing to available stock."}
        onConfirm={() => void handleReturnConfirm()}
        onCancel={closeReturnConfirm}
        isLoading={isSubmittingReturn}
      />
    </>
  );
}