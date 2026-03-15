"use server";

import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { expense, financialSnapshot, lead } from "@/db/schema";
import { auth } from "@/lib/auth";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function ensureSnapshot() {
  const existing = await db.query.financialSnapshot.findFirst({
    where: eq(financialSnapshot.id, "default"),
  });
  if (existing) {
    return existing;
  }
  const [row] = await db
    .insert(financialSnapshot)
    .values({ id: "default" })
    .returning();
  return row;
}

export type ExpenseRow = typeof expense.$inferSelect & {
  lead: { id: string; name: string } | null;
};

export async function getExpenses() {
  await getUser();
  return db.query.expense.findMany({
    orderBy: [asc(expense.type), asc(expense.name)],
    with: { lead: { columns: { id: true, name: true } } },
  });
}

export async function getLeadExpenses(leadId: string) {
  await getUser();
  return db.query.expense.findMany({
    where: eq(expense.leadId, leadId),
    orderBy: [asc(expense.name)],
  });
}

export async function createExpense(data: {
  name: string;
  type: string;
  amountCents: number;
  billingPeriod?: string | null;
  category?: string | null;
  userId?: string | null;
  leadId?: string | null;
  activeFrom?: Date | null;
  activeTo?: Date | null;
  paidAt?: Date | null;
}) {
  const user = await getUser();
  const [row] = await db
    .insert(expense)
    .values({ ...data, createdBy: user.id })
    .returning();
  return row;
}

export async function updateExpense(
  id: string,
  data: {
    name?: string;
    type?: string;
    amountCents?: number;
    billingPeriod?: string | null;
    category?: string | null;
    userId?: string | null;
    leadId?: string | null;
    activeFrom?: Date | null;
    activeTo?: Date | null;
    paidAt?: Date | null;
  }
) {
  await getUser();
  const [row] = await db
    .update(expense)
    .set(data)
    .where(eq(expense.id, id))
    .returning();
  return row;
}

export async function deleteExpense(id: string) {
  await getUser();
  await db.delete(expense).where(eq(expense.id, id));
}

export async function getFinancialSnapshot() {
  await getUser();
  return ensureSnapshot();
}

export async function updateFinancialSnapshot(data: {
  cashOnHandCents?: number;
  mrrAdjustmentCents?: number;
}) {
  await getUser();
  await ensureSnapshot();
  const [row] = await db
    .update(financialSnapshot)
    .set(data)
    .where(eq(financialSnapshot.id, "default"))
    .returning();
  return row;
}

export async function getFinancialOverview() {
  await getUser();

  const [snapshot, expenses, leadMrrResult] = await Promise.all([
    ensureSnapshot(),
    db.query.expense.findMany({
      orderBy: [asc(expense.type), asc(expense.name)],
      with: { lead: { columns: { id: true, name: true } } },
    }),
    db
      .select({ total: sql<number>`coalesce(sum(${lead.value}), 0)` })
      .from(lead)
      .where(
        and(
          isNotNull(lead.convertedAt),
          isNull(lead.churnedAt),
          isNull(lead.lostAt)
        )
      ),
  ]);

  const leadMrrCents = Number(leadMrrResult[0]?.total ?? 0);
  const totalMrrCents = leadMrrCents + snapshot.mrrAdjustmentCents;
  const arrCents = totalMrrCents * 12;

  const now = new Date();
  let monthlyExpenseCents = 0;
  const activeExpenses = expenses.filter(
    (e) => (!e.activeTo || e.activeTo > now) && e.type !== "one_time"
  );

  for (const e of activeExpenses) {
    if (e.billingPeriod === "yearly") {
      monthlyExpenseCents += Math.round(e.amountCents / 12);
    } else {
      monthlyExpenseCents += e.amountCents;
    }
  }

  const yearlyExpenseCents = monthlyExpenseCents * 12;
  const netBurnMonthlyCents = monthlyExpenseCents - totalMrrCents;
  const runwayMonths =
    netBurnMonthlyCents > 0
      ? snapshot.cashOnHandCents / netBurnMonthlyCents
      : null;
  const runwayYears = runwayMonths != null ? runwayMonths / 12 : null;

  const categoryBreakdown: Record<string, number> = {};
  for (const e of activeExpenses) {
    const cat = e.category ?? "Other";
    const monthly =
      e.billingPeriod === "yearly"
        ? Math.round(e.amountCents / 12)
        : e.amountCents;
    categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + monthly;
  }

  return {
    snapshot,
    expenses,
    leadMrrCents,
    totalMrrCents,
    arrCents,
    monthlyExpenseCents,
    yearlyExpenseCents,
    netBurnMonthlyCents,
    runwayMonths,
    runwayYears,
    categoryBreakdown,
  };
}
