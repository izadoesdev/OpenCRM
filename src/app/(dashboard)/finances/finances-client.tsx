"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import type { ExpenseRow } from "@/lib/actions/finances";
import { useFinancialOverview } from "@/lib/queries";
import { ExpenseDialog } from "./_components/expense-dialog";
import { ExpenseTable } from "./_components/expense-table";
import { FinancialOverviewCard } from "./_components/financial-overview-card";
import { PayrollTable } from "./_components/payroll-table";

function fmt(cents: number) {
  if (cents === 0) {
    return "$0";
  }
  const abs = Math.abs(cents);
  const s = `$${(abs / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return cents < 0 ? `-${s}` : s;
}

function Stat({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={`font-mono font-semibold text-sm tabular-nums ${accent ?? ""}`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-muted-foreground/60">{sub}</span>
      )}
    </div>
  );
}

export function FinancesClient() {
  const { data, isLoading } = useFinancialOverview();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);

  if (isLoading || !data) {
    return <PageSkeleton header="Finances" />;
  }

  const runwayLabel =
    data.runwayMonths != null ? `${data.runwayMonths.toFixed(1)} mo` : "∞";

  function openAdd() {
    setEditingExpense(null);
    setDialogOpen(true);
  }

  function openEdit(e: ExpenseRow) {
    setEditingExpense(e);
    setDialogOpen(true);
  }

  const payroll = data.expenses.filter((e) => e.type === "payroll");
  const nonPayroll = data.expenses.filter((e) => e.type !== "payroll");

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between gap-4">
          <h1 className="font-semibold text-lg tracking-tight">Finances</h1>
          <div className="flex items-center gap-5">
            <Stat
              accent="text-emerald-600"
              label="Cash"
              value={fmt(data.snapshot.cashOnHandCents)}
            />
            <Stat
              accent="text-blue-600"
              label="MRR"
              sub={`ARR ${fmt(data.arrCents)}`}
              value={fmt(data.totalMrrCents)}
            />
            <Stat
              accent="text-red-600"
              label="Burn"
              sub="/mo"
              value={fmt(data.monthlyExpenseCents)}
            />
            <Stat accent="text-amber-600" label="Runway" value={runwayLabel} />
            <Button onClick={openAdd} size="sm">
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Add
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1400px] gap-4 p-4">
          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <ExpenseTable expenses={nonPayroll} onEdit={openEdit} />
            <PayrollTable expenses={payroll} onEdit={openEdit} />
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0">
            <FinancialOverviewCard data={data} />
          </div>
        </div>
      </div>

      <ExpenseDialog
        expense={editingExpense}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingExpense(null);
          }
        }}
        open={dialogOpen}
      />
    </div>
  );
}
