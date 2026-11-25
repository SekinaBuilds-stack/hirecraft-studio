"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { STATUSES, STATUS_LABELS, type Application, type Status } from "@/lib/types";

type FieldError = { field: string; message: string };

type Props = {
  application: Application | null; // null = creating a new one
  onClose: () => void;
  onSaved: (application: Application) => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function ApplicationDialog({ application, onClose, onSaved }: Props) {
  const router = useRouter();
  const isEdit = application !== null;

  const [form, setForm] = useState({
    company: application?.company ?? "",
    role: application?.role ?? "",
    status: (application?.status ?? "WISHLIST") as Status,
    location: application?.location ?? "",
    salary: application?.salary ?? "",
    jobUrl: application?.jobUrl ?? "",
    notes: application?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<FieldError[]>([]);
  const [saving, setSaving] = useState(false);

  // Close with the Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const fieldMessage = (field: string) => details.find((d) => d.field === field)?.message;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDetails([]);
    setSaving(true);

    try {
      const res = await apiFetch(isEdit ? `/api/applications/${application.id}` : "/api/applications", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not save");
        setDetails(data?.details ?? []);
        return;
      }
      onSaved(data.application);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-xl"
      >
        <h2 className="text-lg font-bold">{isEdit ? "Edit application" : "Add application"}</h2>

        {error && (
          <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Company *
            <input required className={inputClass} value={form.company} onChange={set("company")} />
            {fieldMessage("company") && <span className="text-xs text-rose-600">{fieldMessage("company")}</span>}
          </label>
          <label className="block text-sm font-medium">
            Role *
            <input required className={inputClass} value={form.role} onChange={set("role")} />
            {fieldMessage("role") && <span className="text-xs text-rose-600">{fieldMessage("role")}</span>}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Status
            <select className={inputClass} value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Location
            <input className={inputClass} value={form.location} onChange={set("location")} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Salary
            <input className={inputClass} value={form.salary} onChange={set("salary")} />
          </label>
          <label className="block text-sm font-medium">
            Job posting URL
            <input
              type="url"
              placeholder="https://…"
              className={inputClass}
              value={form.jobUrl}
              onChange={set("jobUrl")}
            />
            {fieldMessage("jobUrl") && <span className="text-xs text-rose-600">{fieldMessage("jobUrl")}</span>}
          </label>
        </div>

        <label className="block text-sm font-medium">
          Notes
          <textarea rows={4} className={inputClass} value={form.notes} onChange={set("notes")} />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}