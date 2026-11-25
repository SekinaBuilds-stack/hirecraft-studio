import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center text-slate-900">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Hirecraft</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Track every job application, and get a game plan for each one.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register" className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
          Get started
        </Link>
        <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-100">
          Log in
        </Link>
      </div>
    </main>
  );
}