import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ReportingCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <div className="flex items-center justify-between px-3 pt-3 pb-0">
        <div>
          <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            {title}
          </h2>
          {description && (
            <p className="text-[10px] text-muted-foreground/60">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-3 pt-1.5 pb-3">{children}</div>
    </div>
  );
}

export function MetricRow({
  label,
  value,
  max,
  barClass,
  suffix,
  labelWidth = "w-16",
}: {
  label: string;
  value: number;
  max: number;
  barClass?: string;
  suffix?: ReactNode;
  labelWidth?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span
        className={cn(
          "shrink-0 truncate text-[11px] text-muted-foreground",
          labelWidth
        )}
      >
        {label}
      </span>
      <div className="h-1 flex-1 rounded-full bg-muted/40">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barClass ?? "bg-primary/50"
          )}
          style={{
            width: `${Math.max(pct, 2)}%`,
            minWidth: value > 0 ? "4px" : undefined,
          }}
        />
      </div>
      <span className="w-6 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
        {value}
      </span>
      {suffix}
    </div>
  );
}

export function FunnelRow({
  label,
  value,
  max,
  barColor,
}: {
  label: string;
  value: number;
  max: number;
  barColor: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-20 shrink-0 text-[11px] text-muted-foreground">
        {label}
      </span>
      <div className="h-4 flex-1 rounded bg-muted/30">
        <div
          className={cn(
            "flex h-full items-center justify-end rounded px-1.5 transition-all duration-500",
            barColor
          )}
          style={{
            width: `${Math.max(pct, 3)}%`,
            minWidth: value > 0 ? "22px" : undefined,
          }}
        >
          {value > 0 && (
            <span className="font-mono text-[9px] text-white mix-blend-difference">
              {value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReportingEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground">
      <p className="text-[11px]">{message}</p>
    </div>
  );
}
