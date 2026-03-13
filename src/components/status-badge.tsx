import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-sm px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${STATUS_COLORS[status].split(" ")[0]}`}
    />
  );
}
