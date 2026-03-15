"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { Pill } from "@/components/micro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { ExpenseRow } from "@/lib/actions/finances";
import { BILLING_PERIOD_LABELS } from "@/lib/constants";
import { useDeleteExpense } from "@/lib/queries";

const PER_PAGE = 20;

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthly(e: ExpenseRow) {
  if (e.type === "one_time") {
    return e.amountCents;
  }
  return e.billingPeriod === "yearly"
    ? Math.round(e.amountCents / 12)
    : e.amountCents;
}

function yearly(e: ExpenseRow) {
  if (e.type === "one_time") {
    return e.amountCents;
  }
  return e.billingPeriod === "yearly" ? e.amountCents : e.amountCents * 12;
}

type SortKey = "name" | "monthly" | "yearly" | "category";
type SortDir = "asc" | "desc";

export function ExpenseTable({
  expenses,
  onEdit,
}: {
  expenses: ExpenseRow[];
  onEdit: (e: ExpenseRow) => void;
}) {
  const deleteMut = useDeleteExpense();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "subscription" | "one_time"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ExpenseRow | null>(null);

  const { dialog: deleteDialog, setOpen: setDeleteOpen } = useConfirmDialog({
    title: "Delete Expense",
    description: pendingDelete
      ? `Delete "${pendingDelete.name}"? This cannot be undone.`
      : "",
    confirmLabel: "Delete",
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

  const filtered = useMemo(() => {
    let r = expenses;
    if (typeFilter !== "all") {
      r = r.filter((e) => e.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.category ?? "").toLowerCase().includes(q) ||
          (e.lead?.name ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [expenses, typeFilter, search]);

  const sorted = useMemo(() => {
    const m = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return m * a.name.localeCompare(b.name);
        case "monthly":
          return m * (monthly(a) - monthly(b));
        case "yearly":
          return m * (yearly(a) - yearly(b));
        case "category":
          return m * (a.category ?? "").localeCompare(b.category ?? "");
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const p = Math.min(page, pages - 1);
  const rows = sorted.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
  const totalMo = filtered.reduce((s, e) => s + monthly(e), 0);
  const totalYr = filtered.reduce((s, e) => s + yearly(e), 0);

  function toggle(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  return (
    <div className="rounded-lg border bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <h2 className="mr-1 font-semibold text-xs tracking-tight">Expenses</h2>
        <div className="relative flex-1">
          <HugeiconsIcon
            className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
            size={12}
            strokeWidth={1.5}
          />
          <Input
            className="h-7 w-full max-w-52 pr-6 pl-7 text-xs"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearch("");
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Search..."
            value={search}
          />
          {search && (
            <button
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={10} strokeWidth={2} />
            </button>
          )}
        </div>
        <NativeSelect
          className="h-7 w-auto text-[11px]"
          onChange={(e) => {
            setTypeFilter(e.target.value as typeof typeFilter);
            setPage(0);
          }}
          value={typeFilter}
        >
          <NativeSelectOption value="all">All</NativeSelectOption>
          <NativeSelectOption value="subscription">Subs</NativeSelectOption>
          <NativeSelectOption value="one_time">One-time</NativeSelectOption>
        </NativeSelect>
      </div>

      {/* Table */}
      {rows.length > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-muted-foreground">
              <SortTh
                dir={sortDir}
                k="name"
                label="Name"
                sort={sortKey}
                toggle={toggle}
              />
              <SortTh
                dir={sortDir}
                k="category"
                label="Category"
                sort={sortKey}
                toggle={toggle}
              />
              <th className="px-2 py-1.5 text-left font-medium">Period</th>
              <SortTh
                align="right"
                dir={sortDir}
                k="monthly"
                label="Monthly"
                sort={sortKey}
                toggle={toggle}
              />
              <SortTh
                align="right"
                dir={sortDir}
                k="yearly"
                label="Yearly"
                sort={sortKey}
                toggle={toggle}
              />
              <th className="w-14 px-1 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                className="group border-muted/30 border-t transition-colors hover:bg-muted/20"
                key={e.id}
              >
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{e.name}</span>
                    {e.lead && (
                      <Link href={`/leads/${e.lead.id}`}>
                        <Pill
                          className="cursor-pointer text-[10px]"
                          variant="primary"
                        >
                          {e.lead.name}
                        </Pill>
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {e.category ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground">
                  {e.type === "one_time"
                    ? "Once"
                    : (BILLING_PERIOD_LABELS[e.billingPeriod ?? ""] ?? "—")}
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
          <tfoot>
            <tr className="border-t font-medium text-[11px]">
              <td className="px-2 py-1.5" colSpan={3}>
                {filtered.length} item{filtered.length !== 1 && "s"}
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {fmt(totalMo)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground tabular-nums">
                {fmt(totalYr)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="py-8 text-center text-muted-foreground text-xs">
          {expenses.length === 0 ? "No expenses yet." : "No matches."}
        </p>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>
            {p + 1}/{pages}
          </span>
          <div className="flex gap-1">
            <Button
              className="h-6 text-[10px]"
              disabled={p === 0}
              onClick={() => setPage(p - 1)}
              size="sm"
              variant="ghost"
            >
              Prev
            </Button>
            <Button
              className="h-6 text-[10px]"
              disabled={p >= pages - 1}
              onClick={() => setPage(p + 1)}
              size="sm"
              variant="ghost"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {deleteDialog}
    </div>
  );
}

function SortTh({
  k,
  label,
  sort,
  dir,
  toggle,
  align = "left",
}: {
  k: SortKey;
  label: string;
  sort: SortKey;
  dir: SortDir;
  toggle: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort === k;
  return (
    <th
      className={`cursor-pointer select-none px-2 py-1.5 font-medium transition-colors hover:text-foreground ${
        align === "right" ? "text-right" : "text-left"
      } ${active ? "text-foreground" : ""}`}
      onClick={() => toggle(k)}
    >
      {label}
      {active && (
        <HugeiconsIcon
          className="ml-0.5 inline"
          icon={dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
          size={9}
          strokeWidth={2}
        />
      )}
    </th>
  );
}
