"use client";

import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ExpenseRow } from "@/lib/actions/finances";
import {
  BILLING_PERIOD_LABELS,
  BILLING_PERIODS,
  EXPENSE_CATEGORIES,
  EXPENSE_TYPE_LABELS,
  EXPENSE_TYPES,
} from "@/lib/constants";
import {
  useCreateExpense,
  useLeads,
  useTeamMembers,
  useUpdateExpense,
} from "@/lib/queries";

const NON_PAYROLL_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (c) => c !== "Payroll"
);

const PLACEHOLDERS: Record<string, string> = {
  payroll: "e.g. John Doe",
  one_time: "e.g. Conference tickets",
  subscription: "e.g. Hetzner",
};

interface Props {
  expense: ExpenseRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) {
    return null;
  }
  return typeof v === "string" ? new Date(v) : v;
}

function resetForm(setters: {
  setName: (v: string) => void;
  setType: (v: string) => void;
  setAmountDollars: (v: string) => void;
  setBillingPeriod: (v: string) => void;
  setCategory: (v: string) => void;
  setUserId: (v: string) => void;
  setLeadId: (v: string) => void;
  setActiveFrom: (v: Date | null) => void;
  setActiveTo: (v: Date | null) => void;
  setPaidAt: (v: Date | null) => void;
}) {
  setters.setName("");
  setters.setType("subscription");
  setters.setAmountDollars("");
  setters.setBillingPeriod("monthly");
  setters.setCategory("");
  setters.setUserId("");
  setters.setLeadId("");
  setters.setActiveFrom(null);
  setters.setActiveTo(null);
  setters.setPaidAt(null);
}

function populateForm(
  exp: ExpenseRow,
  setters: {
    setName: (v: string) => void;
    setType: (v: string) => void;
    setAmountDollars: (v: string) => void;
    setBillingPeriod: (v: string) => void;
    setCategory: (v: string) => void;
    setUserId: (v: string) => void;
    setLeadId: (v: string) => void;
    setActiveFrom: (v: Date | null) => void;
    setActiveTo: (v: Date | null) => void;
    setPaidAt: (v: Date | null) => void;
  }
) {
  setters.setName(exp.name);
  setters.setType(exp.type);
  setters.setAmountDollars((exp.amountCents / 100).toString());
  setters.setBillingPeriod(exp.billingPeriod ?? "monthly");
  setters.setCategory(exp.type === "payroll" ? "" : (exp.category ?? ""));
  setters.setUserId(exp.userId ?? "");
  setters.setLeadId(exp.leadId ?? "");
  setters.setActiveFrom(toDate(exp.activeFrom));
  setters.setActiveTo(toDate(exp.activeTo));
  setters.setPaidAt(toDate(exp.paidAt));
}

function buildPayload(fields: {
  name: string;
  type: string;
  amountDollars: string;
  billingPeriod: string;
  category: string;
  userId: string;
  leadId: string;
  activeFrom: Date | null;
  activeTo: Date | null;
  paidAt: Date | null;
}) {
  const cents = Math.round(
    Number.parseFloat(fields.amountDollars || "0") * 100
  );
  if (!fields.name.trim() || cents <= 0) {
    return null;
  }

  const isOneTime = fields.type === "one_time";
  const isPayroll = fields.type === "payroll";
  const isSub = fields.type === "subscription";

  return {
    name: fields.name.trim(),
    type: fields.type,
    amountCents: cents,
    billingPeriod: isOneTime ? null : fields.billingPeriod,
    category: isPayroll ? "Payroll" : fields.category || null,
    userId: isPayroll ? fields.userId || null : null,
    leadId: isSub ? fields.leadId || null : null,
    activeFrom: isOneTime ? null : fields.activeFrom,
    activeTo: isOneTime ? null : fields.activeTo,
    paidAt: isOneTime ? fields.paidAt : null,
  };
}

export function ExpenseDialog({ open, onOpenChange, expense }: Props) {
  const isEdit = !!expense;
  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const { data: team } = useTeamMembers();
  const { data: leads } = useLeads({ enabled: open });

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("subscription");
  const [amountDollars, setAmountDollars] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<string>("monthly");
  const [category, setCategory] = useState("");
  const [userId, setUserId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [activeFrom, setActiveFrom] = useState<Date | null>(null);
  const [activeTo, setActiveTo] = useState<Date | null>(null);
  const [paidAt, setPaidAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const s = {
      setName,
      setType,
      setAmountDollars,
      setBillingPeriod,
      setCategory,
      setUserId,
      setLeadId,
      setActiveFrom,
      setActiveTo,
      setPaidAt,
    };
    if (expense) {
      populateForm(expense, s);
    } else {
      resetForm(s);
    }
  }, [open, expense]);

  const dirty =
    name !== (expense?.name ?? "") ||
    amountDollars !== (expense ? (expense.amountCents / 100).toString() : "");

  function handleTypeChange(newType: string) {
    setType(newType);
    if (newType === "payroll") {
      setCategory("");
      setBillingPeriod("monthly");
    }
    if (newType === "one_time") {
      setUserId("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = buildPayload({
      name,
      type,
      amountDollars,
      billingPeriod,
      category,
      userId,
      leadId,
      activeFrom,
      activeTo,
      paidAt,
    });
    if (!data) {
      return;
    }

    const opts = { onSuccess: () => onOpenChange(false) };
    if (isEdit) {
      updateMut.mutate({ id: expense.id, data }, opts);
    } else {
      createMut.mutate(data, opts);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Sheet dirty={dirty} onOpenChange={onOpenChange} open={open}>
      <SheetContent className="sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Expense" : "Add Expense"}</SheetTitle>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          id="expense-form"
          onSubmit={handleSubmit}
        >
          {/* Type toggle */}
          <div className="flex gap-0.5 rounded-lg border p-0.5">
            {EXPENSE_TYPES.map((t) => (
              <button
                className={`flex-1 rounded-md px-2 py-1.5 font-medium text-xs transition-colors ${
                  type === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                key={t}
                onClick={() => handleTypeChange(t)}
                type="button"
              >
                {EXPENSE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Name + Amount */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1">
              <Label className="text-[11px]" htmlFor="exp-name">
                {type === "payroll" ? "Employee" : "Name"}
              </Label>
              <Input
                id="exp-name"
                onChange={(e) => setName(e.target.value)}
                placeholder={PLACEHOLDERS[type] ?? "Name"}
                required
                value={name}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[11px]" htmlFor="exp-amount">
                Amount ($)
              </Label>
              <Input
                id="exp-amount"
                min="0"
                onChange={(e) => setAmountDollars(e.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={amountDollars}
              />
            </div>
          </div>

          {/* Billing period */}
          {type !== "one_time" && (
            <div className="space-y-1">
              <Label className="text-[11px]" htmlFor="exp-period">
                Billing Period
              </Label>
              <NativeSelect
                className="w-full"
                id="exp-period"
                onChange={(e) => setBillingPeriod(e.target.value)}
                value={billingPeriod}
              >
                {BILLING_PERIODS.map((p) => (
                  <NativeSelectOption key={p} value={p}>
                    {BILLING_PERIOD_LABELS[p]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Category (not payroll) */}
          {type !== "payroll" && (
            <div className="space-y-1">
              <Label className="text-[11px]" htmlFor="exp-cat">
                Category
              </Label>
              <NativeSelect
                className="w-full"
                id="exp-cat"
                onChange={(e) => setCategory(e.target.value)}
                value={category}
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {NON_PAYROLL_CATEGORIES.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Team member (payroll) */}
          {type === "payroll" && team && team.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[11px]" htmlFor="exp-user">
                Link to Team Member
              </Label>
              <NativeSelect
                className="w-full"
                id="exp-user"
                onChange={(e) => setUserId(e.target.value)}
                value={userId}
              >
                <NativeSelectOption value="">
                  None (freeform)
                </NativeSelectOption>
                {team.map((m) => (
                  <NativeSelectOption key={m.id} value={m.id}>
                    {m.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Linked lead (subs only) */}
          {type === "subscription" && leads && leads.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[11px]" htmlFor="exp-lead">
                Linked Lead
              </Label>
              <NativeSelect
                className="w-full"
                id="exp-lead"
                onChange={(e) => setLeadId(e.target.value)}
                value={leadId}
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {leads.map((l) => (
                  <NativeSelectOption key={l.id} value={l.id}>
                    {l.name} ({l.company ?? l.email})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Dates */}
          {type === "one_time" ? (
            <div className="space-y-1">
              <Label className="text-[11px]">Paid Date</Label>
              <DateTimePicker onChange={setPaidAt} value={paidAt} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Start Date</Label>
                <DateTimePicker onChange={setActiveFrom} value={activeFrom} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">End Date</Label>
                <DateTimePicker onChange={setActiveTo} value={activeTo} />
              </div>
            </div>
          )}
        </form>

        <SheetFooter>
          <Button disabled={isPending} form="expense-form" type="submit">
            {isPending && "Saving..."}
            {!isPending && (isEdit ? "Update" : "Add Expense")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
