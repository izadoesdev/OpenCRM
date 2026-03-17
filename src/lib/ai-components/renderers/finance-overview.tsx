"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BaseComponentProps } from "../types";

export interface FinanceOverviewProps extends BaseComponentProps {
  arrCents?: number;
  cashOnHandCents?: number;
  categoryBreakdown?: Record<string, number>;
  monthlyBurnCents?: number;
  mrrCents?: number;
  netBurnMonthlyCents?: number;
  runwayMonths?: number | null;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(dollars) >= 10_000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface MetricCardProps {
  label: string;
  sublabel?: string;
  value: string;
  variant?: "default" | "positive" | "negative" | "warning";
}

function MetricCard({
  label,
  value,
  sublabel,
  variant = "default",
}: MetricCardProps) {
  const valueColor = {
    default: "text-foreground",
    positive: "text-emerald-600",
    negative: "text-red-600",
    warning: "text-amber-600",
  }[variant];

  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-3">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("font-semibold text-lg tabular-nums", valueColor)}>
        {value}
      </span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground">{sublabel}</span>
      )}
    </div>
  );
}

export function FinanceOverviewRenderer({
  mrrCents,
  arrCents,
  monthlyBurnCents,
  netBurnMonthlyCents,
  cashOnHandCents,
  runwayMonths,
  categoryBreakdown,
  className,
}: FinanceOverviewProps) {
  const hasMetrics =
    mrrCents !== undefined ||
    cashOnHandCents !== undefined ||
    monthlyBurnCents !== undefined;

  if (!hasMetrics) {
    return null;
  }

  let runwayVariant: MetricCardProps["variant"] = "positive";
  if (runwayMonths !== null && runwayMonths !== undefined) {
    if (runwayMonths < 6) {
      runwayVariant = "negative";
    } else if (runwayMonths < 12) {
      runwayVariant = "warning";
    }
  }

  const categories = categoryBreakdown
    ? Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  const maxCategoryCents = categories.length > 0 ? categories[0][1] : 0;

  return (
    <Card className={className ?? "gap-0 overflow-hidden border bg-card py-0"}>
      <div className="border-b px-3 py-2">
        <p className="font-medium text-sm">Financial Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {mrrCents !== undefined && (
          <MetricCard
            label="MRR"
            sublabel={
              arrCents !== undefined
                ? `${formatMoney(arrCents)} ARR`
                : undefined
            }
            value={formatMoney(mrrCents)}
            variant="positive"
          />
        )}
        {monthlyBurnCents !== undefined && (
          <MetricCard
            label="Burn Rate"
            sublabel={
              netBurnMonthlyCents !== undefined
                ? `${formatMoney(netBurnMonthlyCents)} net`
                : undefined
            }
            value={formatMoney(monthlyBurnCents)}
            variant="negative"
          />
        )}
        {cashOnHandCents !== undefined && (
          <MetricCard
            label="Cash"
            sublabel={
              runwayMonths !== null && runwayMonths !== undefined
                ? `${runwayMonths.toFixed(1)} mo runway`
                : "Infinite runway"
            }
            value={formatMoney(cashOnHandCents)}
            variant={runwayVariant}
          />
        )}
      </div>

      {categories.length > 0 && (
        <div className="border-t px-3 pt-2 pb-3">
          <p className="mb-2 font-medium text-muted-foreground text-xs">
            Spend by Category
          </p>
          <div className="space-y-1.5">
            {categories.map(([category, cents]) => (
              <div className="flex items-center gap-2" key={category}>
                <span className="min-w-[72px] shrink-0 text-xs">
                  {category}
                </span>
                <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-sm bg-primary/20"
                    style={{
                      width: `${maxCategoryCents > 0 ? (cents / maxCategoryCents) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="min-w-[52px] shrink-0 text-right text-xs tabular-nums">
                  {formatMoney(cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
