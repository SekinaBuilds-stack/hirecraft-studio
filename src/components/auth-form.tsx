"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldError = { field: string; message: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDetails([]);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { email, password, name: name || undefined } : { email, password },
        ),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        setDetails(data?.details ?? []);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  const fieldMessage = (field: string) => details.find((d) => d.field === field)?.message;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister ? "Start tracking your applications." : "Log in to see your board."}
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isRegister && (
          <label className="block text-sm font-medium">
            Name (optional)
            <input className={`${inputClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}

        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className={`${inputClass} mt-1`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldMessage("email") && <span className="text-xs text-rose-600">{fieldMessage("email")}</span>}
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={`${inputClass} mt-1`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldMessage("password") && <span className="text-xs text-rose-600">{fieldMessage("password")}</span>}
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          {isRegister ? (
            <>Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Log in</Link></>
          ) : (
            <>Don’t have an account? <Link href="/register" className="text-indigo-600 hover:underline">Register</Link></>
          )}
        </p>
      </form>
    </main>
  );
}