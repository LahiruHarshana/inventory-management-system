"use client";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path
                d="M12 8v4m0 4h.01M10.3 3.84 2.82 16.5A1.5 1.5 0 0 0 4.12 18.75h15.76a1.5 1.5 0 0 0 1.29-2.25L13.7 3.84a1.5 1.5 0 0 0-2.58 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 animate-spin"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="opacity-25"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    className="opacity-90"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}