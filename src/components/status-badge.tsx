import {
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        STATUS_DOT_COLORS[status]
      )}
    />
  );
}
