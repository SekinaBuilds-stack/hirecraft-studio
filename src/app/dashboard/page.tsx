"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { STATUSES, STATUS_DOT, STATUS_LABELS, type Application, type Status } from "@/lib/types";
import { ApplicationCard } from "@/components/application-card";
import { ApplicationDialog } from "@/components/application-dialog";

type User = { id: string; email: string; name: string | null };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; app: Application | null }>({
    open: false,
    app: null,
  });
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  // Load the user and their applications once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meRes = await apiFetch("/api/auth/me");
        if (!meRes.ok) {
          router.replace("/login"); // not logged in (even after trying a refresh)
          return;
        }
        const me = await meRes.json();

        const listRes = await apiFetch("/api/applications");
        if (cancelled) return;

        setUser(me.user);
        if (listRes.ok) {
          const list = await listRes.json();
          setApps(list.applications);
        } else {
          showToast("Could not load your applications.");
        }
      } catch {
        if (!cancelled) showToast("Network error. Is the server running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q),
    );
  }, [apps, search]);

  const byStatus = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [s, filtered.filter((a) => a.status === s)]),
      ) as Record<Status, Application[]>,
    [filtered],
  );

  const stats = {
    total: apps.length,
    active: apps.filter((a) => a.status === "APPLIED" || a.status === "INTERVIEW").length,
    offers: apps.filter((a) => a.status === "OFFER").length,
  };

  // Optimistic update: change the UI first, undo it if the server refuses
  async function handleMove(app: Application, status: Status) {
    if (status === app.status) return;
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));

    try {
      const res = await apiFetch(`/api/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("failed");
      const { application } = await res.json(); // includes the auto-filled appliedAt
      setApps((prev) => prev.map((a) => (a.id === app.id ? application : a)));
    } catch {
      setApps((prev) => prev.map((a) => (a.id === app.id ? app : a))); // roll back this card
      showToast("Could not move the card. Please try again.");
    }
  }

  async function handleDelete(app: Application) {
    if (!confirm(`Delete “${app.role}” at ${app.company}?`)) return;
    try {
      const res = await apiFetch(`/api/applications/${app.id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("failed");
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch {
      showToast("Could not delete. Please try again.");
    }
  }

  function handleSaved(saved: Application) {
    setApps((prev) =>
      prev.some((a) => a.id === saved.id)
        ? prev.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...prev],
    );
    setDialog({ open: false, app: null });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-lg font-bold">Hirecraft</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{user?.name ?? user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6 text-sm text-slate-600">
            <span><b className="text-slate-900">{stats.total}</b> total</span>
            <span><b className="text-slate-900">{stats.active}</b> active</span>
            <span><b className="text-slate-900">{stats.offers}</b> offers</span>
          </div>
          <div className="flex gap-2">
            <input
              type="search"
              placeholder="Search company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => setDialog({ open: true, app: null })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Add application
            </button>
          </div>
        </div>

        {apps.length === 0 && (
          <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No applications yet. Click <b>Add application</b> to create your first one.
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <section key={status} className="min-w-[260px] flex-1">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
                {STATUS_LABELS[status]}
                <span className="text-slate-400">{byStatus[status].length}</span>
              </h2>
              <div className="space-y-3">
                {byStatus[status].map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onMove={(s) => handleMove(app, s)}
                    onEdit={() => setDialog({ open: true, app })}
                    onDelete={() => handleDelete(app)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {dialog.open && (
        <ApplicationDialog
          application={dialog.app}
          onClose={() => setDialog({ open: false, app: null })}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}