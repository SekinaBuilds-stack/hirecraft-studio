export const STATUSES = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const STATUS_DOT: Record<Status, string> = {
  WISHLIST: "bg-slate-400",
  APPLIED: "bg-blue-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

// Dates arrive from the API as ISO strings
export type Application = {
  id: string;
  company: string;
  role: string;
  status: Status;
  location: string | null;
  jobUrl: string | null;
  salary: string | null;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};