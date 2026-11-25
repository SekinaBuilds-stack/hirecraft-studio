//browser helper that auto-refreshes
let refreshing: Promise<boolean> | null = null;

// Only one refresh runs at a time, even if many requests fail together
function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Use this for every API call EXCEPT login/register
export async function apiFetch(input: string, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  await refreshSession();
  return fetch(input, init); // retry once; if still 401, the caller sends the user to /login
}