import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Active:      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive:    "bg-zinc-50 text-zinc-500 ring-zinc-200",
  Planned:     "bg-blue-50 text-blue-700 ring-blue-200",
  Pending:     "bg-amber-50 text-amber-700 ring-amber-200",
  Completed:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled:   "bg-rose-50 text-rose-600 ring-rose-200",
  Rescheduled: "bg-violet-50 text-violet-700 ring-violet-200",
  Converted:   "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

const dots: Record<string, string> = {
  Active:      "bg-emerald-500",
  Inactive:    "bg-zinc-400",
  Planned:     "bg-blue-500",
  Pending:     "bg-amber-500",
  Completed:   "bg-emerald-500",
  Cancelled:   "bg-rose-500",
  Rescheduled: "bg-violet-500",
  Converted:   "bg-indigo-500",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] ?? "bg-slate-50 text-slate-600 ring-slate-200";
  const dot = dots[status] ?? "bg-slate-400";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {status}
    </span>
  );
}
