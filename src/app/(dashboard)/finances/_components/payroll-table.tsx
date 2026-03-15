"use client";

import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseRow } from "@/lib/actions/finances";
import { BILLING_PERIOD_LABELS } from "@/lib/constants";
import { useDeleteExpense } from "@/lib/queries";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthly(e: ExpenseRow) {
  return e.billingPeriod === "yearly"
    ? Math.round(e.amountCents / 12)
    : e.amountCents;
}

function yearly(e: ExpenseRow) {
  return e.billingPeriod === "yearly" ? e.amountCents : e.amountCents * 12;
}

export function PayrollTable({
  expenses,
  onEdit,
}: {
  expenses: ExpenseRow[];
  onEdit: (e: ExpenseRow) => void;
}) {
  const deleteMut = useDeleteExpense();
  const [pendingDelete, setPendingDelete] = useState<ExpenseRow | null>(null);

  const { dialog: deleteDialog, setOpen: setDeleteOpen } = useConfirmDialog({
    title: "Remove Payroll Entry",
    description: pendingDelete
      ? `Remove "${pendingDelete.name}" from payroll? This cannot be undone.`
      : "",
    confirmLabel: "Remove",
    variant: "danger",
    icon: Delete02Icon,
    onConfirm: () => {
      if (pendingDelete) {
        deleteMut.mutate(pendingDelete.id);
      }
    },
  });

  function confirmDelete(e: ExpenseRow) {
    setPendingDelete(e);
    setDeleteOpen(true);
  }

  const totalMo = expenses.reduce((s, e) => s + monthly(e), 0);
  const totalYr = expenses.reduce((s, e) => s + yearly(e), 0);

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2">
        <h2 className="font-semibold text-xs tracking-tight">Payroll</h2>
        <p className="mt-2 pb-2 text-center text-muted-foreground text-xs">
          No payroll entries.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="font-semibold text-xs tracking-tight">Payroll</h2>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {fmt(totalMo)}/mo · {fmt(totalYr)}/yr
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-medium">Name</th>
            <th className="px-2 py-1.5 text-left font-medium">Period</th>
            <th className="px-2 py-1.5 text-right font-medium">Monthly</th>
            <th className="px-2 py-1.5 text-right font-medium">Yearly</th>
            <th className="w-14 px-1 py-1.5" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr
              className="group border-muted/30 border-t transition-colors hover:bg-muted/20"
              key={e.id}
            >
              <td className="px-2 py-1.5 font-medium">{e.name}</td>
              <td className="px-2 py-1.5 text-muted-foreground">
                {BILLING_PERIOD_LABELS[e.billingPeriod ?? ""] ?? "Monthly"}
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {fmt(monthly(e))}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground tabular-nums">
                {fmt(yearly(e))}
              </td>
              <td className="px-1 py-1.5">
                <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    onClick={() => onEdit(e)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon
                      icon={PencilEdit01Icon}
                      size={12}
                      strokeWidth={1.5}
                    />
                  </Button>
                  <Button
                    onClick={() => confirmDelete(e)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={12}
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteDialog}
    </div>
  );
}
