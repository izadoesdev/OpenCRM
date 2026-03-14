import type { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  color: string;
  icon: typeof Add01Icon;
  label: string;
  sub?: string;
  value: string | number;
}

export function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          color
        )}
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="font-mono font-semibold text-lg leading-tight tracking-tight">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {label}
          {sub && (
            <span className="ml-1.5 text-muted-foreground/50">{sub}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function StatCardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  );
}
