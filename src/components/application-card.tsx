"use client";

import { STATUSES, STATUS_LABELS, type Application, type Status } from "@/lib/types";

type Props = {
  app: Application;
  onMove: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ApplicationCard({ app, onMove, onEdit, onDelete }: Props) {
  const meta = [app.location, app.salary].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="font-semibold text-slate-900">{app.company}</div>
      <div className="text-sm text-slate-600">{app.role}</div>

      {meta && <div className="mt-1 text-xs text-slate-500">{meta}</div>}
      {app.appliedAt && (
        <div className="mt-1 text-xs text-slate-500">
          Applied {new Date(app.appliedAt).toLocaleDateString()}
        </div>
      )}
      {app.jobUrl && (
        <a
          href={app.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
        >
          View posting ↗
        </a>
      )}
      {app.notes && (
        <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs text-slate-600">{app.notes}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <select
          aria-label="Move to status"
          value={app.status}
          onChange={(e) => onMove(e.target.value as Status)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button onClick={onEdit} className="text-xs font-medium text-slate-600 hover:text-indigo-600">
          Edit
        </button>
        <button onClick={onDelete} className="text-xs font-medium text-slate-600 hover:text-rose-600">
          Delete
        </button>
      </div>
    </div>
  );
}