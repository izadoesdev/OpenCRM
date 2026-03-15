"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { getFinancialOverview } from "@/lib/actions/finances";
import { useUpdateFinancialSnapshot } from "@/lib/queries";

type OverviewData = Awaited<ReturnType<typeof getFinancialOverview>>;

function fmt(cents: number) {
  if (cents === 0) {
    return "$0";
  }
  const abs = Math.abs(cents);
  const s = `$${(abs / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return cents < 0 ? `-${s}` : s;
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={`font-mono font-semibold text-[12px] tabular-nums ${accent ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function FinancialOverviewCard({ data }: { data: OverviewData }) {
  const updateMut = useUpdateFinancialSnapshot();
  const [cashInput, setCashInput] = useState(
    (data.snapshot.cashOnHandCents / 100).toString()
  );
  const [mrrAdjInput, setMrrAdjInput] = useState(
    (data.snapshot.mrrAdjustmentCents / 100).toString()
  );
  const [editing, setEditing] = useState(false);

  function handleSave() {
    updateMut.mutate(
      {
        cashOnHandCents: Math.round(Number.parseFloat(cashInput || "0") * 100),
        mrrAdjustmentCents: Math.round(
          Number.parseFloat(mrrAdjInput || "0") * 100
        ),
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  const cats = Object.entries(data.categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  );
  const maxCat = Math.max(1, ...Object.values(data.categoryBreakdown));

  return (
    <div className="sticky top-4 space-y-3">
      {/* Overview */}
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between px-3 pt-3 pb-0">
          <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            Overview
          </h2>
          {!editing && (
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit
            </button>
          )}
        </div>

        <div className="px-3 pt-1.5 pb-3">
          {editing ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor="fc">
                  Cash ($)
                </Label>
                <Input
                  className="h-7 text-xs"
                  id="fc"
                  min="0"
                  onChange={(e) => setCashInput(e.target.value)}
                  step="0.01"
                  type="number"
                  value={cashInput}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor="fm">
                  MRR Adj ($)
                </Label>
                <Input
                  className="h-7 text-xs"
                  id="fm"
                  onChange={(e) => setMrrAdjInput(e.target.value)}
                  step="0.01"
                  type="number"
                  value={mrrAdjInput}
                />
                <p className="text-[9px] text-muted-foreground">
                  Extra MRR not from leads
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  className="h-6 text-[10px]"
                  disabled={updateMut.isPending}
                  onClick={handleSave}
                  size="sm"
                >
                  {updateMut.isPending ? "..." : "Save"}
                </Button>
                <Button
                  className="h-6 text-[10px]"
                  onClick={() => setEditing(false)}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Row
                accent="text-emerald-600"
                label="Cash"
                value={fmt(data.snapshot.cashOnHandCents)}
              />
              <div className="my-1 border-t border-dashed" />
              <Row label="Lead MRR" value={fmt(data.leadMrrCents)} />
              {data.snapshot.mrrAdjustmentCents !== 0 && (
                <Row
                  label="MRR Adj"
                  value={fmt(data.snapshot.mrrAdjustmentCents)}
                />
              )}
              <Row
                accent="text-blue-600"
                label="Total MRR"
                value={fmt(data.totalMrrCents)}
              />
              <Row label="ARR" value={fmt(data.arrCents)} />
              <div className="my-1 border-t border-dashed" />
              <Row label="Mo. Expenses" value={fmt(data.monthlyExpenseCents)} />
              <Row label="Yr. Expenses" value={fmt(data.yearlyExpenseCents)} />
              <Row
                accent="text-red-600"
                label="Net Burn"
                value={fmt(data.netBurnMonthlyCents)}
              />
              <div className="my-1 border-t border-dashed" />
              <Row
                accent="text-amber-600"
                label="Runway"
                value={
                  data.runwayMonths != null
                    ? `${data.runwayMonths.toFixed(1)} mo`
                    : "∞"
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      {cats.length > 0 && (
        <div className="rounded-lg border bg-background">
          <div className="px-3 pt-3 pb-0">
            <h2 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              Burn by Category
            </h2>
          </div>
          <div className="px-3 pt-1 pb-3">
            {cats.map(([cat, cents]) => {
              const pct = maxCat > 0 ? (cents / maxCat) * 100 : 0;
              return (
                <div className="flex items-center gap-2 py-0.5" key={cat}>
                  <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground">
                    {cat}
                  </span>
                  <div className="h-1 flex-1 rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-primary/40"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[10px] text-muted-foreground tabular-nums">
                    {fmt(cents)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
