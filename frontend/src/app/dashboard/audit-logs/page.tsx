"use client";

import { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

type AuditAction = "created" | "updated" | "deleted" | string;

interface AuditUser {
  id: number;
  name: string;
  email?: string;
}

interface AuditLog {
  id: number;
  action: AuditAction;
  auditable_type: string;
  auditable_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user?: AuditUser | null;
}

type PaginatedResponse<T> = {
  data: T[];
};

type LaravelErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const actionClassNames: Record<string, string> = {
  created: "border-emerald-200 bg-emerald-50 text-emerald-700",
  updated: "border-amber-200 bg-amber-50 text-amber-700",
  deleted: "border-rose-200 bg-rose-50 text-rose-700",
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

const formatDateTime = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatActionLabel = (action: string) => {
  if (!action) {
    return "Unknown";
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
};

const formatResourceLabel = (auditableType: string) => {
  const segment = auditableType.split("\\").pop() || auditableType;

  return segment.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
};

const formatJsonValue = (value: Record<string, unknown> | null) => {
  if (!value || Object.keys(value).length === 0) {
    return "No recorded values.";
  }

  return JSON.stringify(value, null, 2);
};

const ChangesModal = ({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) => {
  if (!log) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Audit Inspection
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              View Changes
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Compare the recorded previous state and new state for this {formatResourceLabel(log.auditable_type).toLowerCase()} change.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close changes modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6 18 18" strokeLinecap="round" />
              <path d="M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 grid gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">User</p>
              <p className="mt-2 text-sm font-medium text-gray-900">{log.user?.name || "System"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Action</p>
              <p className="mt-2 text-sm font-medium text-gray-900">{formatActionLabel(log.action)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Resource</p>
              <p className="mt-2 text-sm font-medium text-gray-900">{formatResourceLabel(log.auditable_type)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Timestamp</p>
              <p className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(log.created_at)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Previous Value</h3>
                <p className="mt-1 text-sm text-gray-500">
                  State recorded before this action was committed.
                </p>
              </div>
              <div className="p-6">
                <pre className="min-h-[260px] overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {formatJsonValue(log.old_values)}
                </pre>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">New Value</h3>
                <p className="mt-1 text-sm text-gray-500">
                  State recorded after this action was applied.
                </p>
              </div>
              <div className="p-6">
                <pre className="min-h-[260px] overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {formatJsonValue(log.new_values)}
                </pre>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<PaginatedResponse<AuditLog>>("/audit-logs");
      setLogs(response.data.data);
    } catch (fetchError) {
      const message = formatErrorMessage(fetchError, "Unable to load audit logs right now.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const logCountLabel = useMemo(() => {
    return `${logs.length} log${logs.length === 1 ? "" : "s"} available`;
  }, [logs]);

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Administration
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Audit Logs
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-gray-500">
              Review critical system activity, including who performed each change, when it occurred, and exactly what values were updated.
            </p>
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
                Activity History
              </h2>
              <p className="mt-1 text-sm text-gray-500">{logCountLabel}</p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500 sm:px-8">
              No audit activity found for the current environment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Date &amp; Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Module / Resource
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:px-8">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => {
                    const actionKey = log.action.toLowerCase();

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {log.user?.name || "System"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {log.user?.email || "Automated or unavailable"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 sm:px-8">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${actionClassNames[actionKey] || "border-slate-200 bg-slate-100 text-slate-700"}`}
                          >
                            {formatActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 sm:px-8">
                          <div>
                            <p className="font-medium text-gray-900">{formatResourceLabel(log.auditable_type)}</p>
                            <p className="mt-1 text-xs text-gray-500">Record #{log.auditable_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right sm:px-8">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            View Changes
                          </button>
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

      <ChangesModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
}