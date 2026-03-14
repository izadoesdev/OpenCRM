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
    <div className={cn("rounded-xl border bg-background", className)}>
      <div className="flex items-start justify-between px-5 pt-5 pb-0">
        <div>
          <h2 className="font-semibold text-[13px] tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-muted-foreground text-xs">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-background px-5 py-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono font-semibold text-2xl tracking-tight",
          accent
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function MetricRow({
  label,
  value,
  max,
  barClass,
  suffix,
  labelWidth = "w-20",
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
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={cn("shrink-0 text-[13px] text-muted-foreground", labelWidth)}
      >
        {label}
      </span>
      <div className="h-1.5 flex-1 rounded-full bg-muted/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barClass ?? "bg-primary/50"
          )}
          style={{
            width: `${Math.max(pct, 2)}%`,
            minWidth: value > 0 ? "6px" : undefined,
          }}
        />
      </div>
      <span className="w-8 text-right font-mono text-muted-foreground text-xs tabular-nums">
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
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 text-[13px] text-muted-foreground">
        {label}
      </span>
      <div className="h-5 flex-1 rounded-md bg-muted/30">
        <div
          className={cn(
            "flex h-full items-center justify-end rounded-md px-2 transition-all duration-500",
            barColor
          )}
          style={{
            width: `${Math.max(pct, 3)}%`,
            minWidth: value > 0 ? "28px" : undefined,
          }}
        >
          {value > 0 && (
            <span className="font-mono text-[10px] text-white mix-blend-difference">
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
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <p className="text-[13px]">{message}</p>
    </div>
  );
}
