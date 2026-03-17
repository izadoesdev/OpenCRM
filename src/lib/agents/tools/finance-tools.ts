import { tool } from "ai";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { expense, financialSnapshot, lead } from "@/db/schema";
import {
  BILLING_PERIODS,
  EXPENSE_CATEGORIES,
  EXPENSE_TYPES,
} from "@/lib/constants";

function createFinanceTools() {
  const getFinancialOverview = tool({
    description:
      "Get a full financial overview: MRR, ARR, burn rate, runway, cash on hand, and category breakdown. Always call this first for any finance question.",
    inputSchema: z.object({}),
    execute: async () => {
      const [snapshot, leadMrrResult] = await Promise.all([
        ensureSnapshot(),
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

      const activeExpenses = await db.query.expense.findMany({
        where: and(
          sql`(${expense.activeTo} IS NULL OR ${expense.activeTo} > now())`,
          sql`${expense.type} != 'one_time'`
        ),
      });

      const leadMrrCents = Number(leadMrrResult[0]?.total ?? 0);
      const totalMrrCents = leadMrrCents + snapshot.mrrAdjustmentCents;
      const arrCents = totalMrrCents * 12;

      let monthlyExpenseCents = 0;
      for (const e of activeExpenses) {
        if (e.billingPeriod === "yearly") {
          monthlyExpenseCents += Math.round(e.amountCents / 12);
        } else {
          monthlyExpenseCents += e.amountCents;
        }
      }

      const netBurnMonthlyCents = monthlyExpenseCents - totalMrrCents;
      const runwayMonths =
        netBurnMonthlyCents > 0
          ? snapshot.cashOnHandCents / netBurnMonthlyCents
          : null;

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
        cashOnHandCents: snapshot.cashOnHandCents,
        mrrCents: totalMrrCents,
        arrCents,
        monthlyBurnCents: monthlyExpenseCents,
        netBurnMonthlyCents,
        runwayMonths: runwayMonths ? Math.round(runwayMonths * 10) / 10 : null,
        categoryBreakdown,
        activeExpenseCount: activeExpenses.length,
      };
    },
  });

  const queryExpenses = tool({
    description:
      "List expenses with optional filters by type, category, or date range. Returns name, type, amount, category, billing period.",
    inputSchema: z.object({
      type: z.enum(EXPENSE_TYPES).optional().describe("Filter by expense type"),
      category: z.string().optional().describe("Filter by category"),
      activeOnly: z
        .boolean()
        .optional()
        .describe("Only show active (non-expired) expenses"),
      sort: z
        .enum(["name", "amountCents", "createdAt"])
        .optional()
        .describe("Sort field"),
      order: z.enum(["asc", "desc"]).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async ({ type, category, activeOnly, sort, order, limit }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (type) {
        conditions.push(eq(expense.type, type));
      }
      if (category) {
        conditions.push(eq(expense.category, category));
      }
      if (activeOnly) {
        conditions.push(
          sql`(${expense.activeTo} IS NULL OR ${expense.activeTo} > now())`
        );
      }

      const sortMap = {
        name: expense.name,
        amountCents: expense.amountCents,
        createdAt: expense.createdAt,
      } as const;
      const sortCol = sortMap[sort ?? "createdAt"];
      const orderFn = order === "asc" ? asc : desc;

      const rows = await db.query.expense.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [orderFn(sortCol)],
        limit: limit ?? 50,
        with: { lead: { columns: { id: true, name: true } } },
      });

      return {
        count: rows.length,
        expenses: rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          amountCents: r.amountCents,
          amountDollars: r.amountCents / 100,
          billingPeriod: r.billingPeriod,
          category: r.category,
          lead: r.lead,
          activeFrom: r.activeFrom?.toISOString() ?? null,
          activeTo: r.activeTo?.toISOString() ?? null,
        })),
      };
    },
  });

  const createExpense = tool({
    description:
      "Create a new expense (subscription, payroll, or one-time). Amount is in cents.",
    inputSchema: z.object({
      name: z.string().describe("Expense name"),
      type: z
        .enum(EXPENSE_TYPES)
        .describe("subscription, payroll, or one_time"),
      amountCents: z.number().int().min(1).describe("Amount in cents"),
      billingPeriod: z
        .enum(BILLING_PERIODS)
        .optional()
        .describe("monthly or yearly (for subscriptions)"),
      category: z
        .enum(EXPENSE_CATEGORIES)
        .optional()
        .describe("Expense category"),
      leadId: z.string().optional().describe("Associated lead ID if any"),
    }),
    execute: async ({
      name,
      type,
      amountCents,
      billingPeriod,
      category,
      leadId,
    }) => {
      const [row] = await db
        .insert(expense)
        .values({
          name,
          type,
          amountCents,
          billingPeriod: billingPeriod ?? null,
          category: category ?? null,
          leadId: leadId ?? null,
        })
        .returning();

      return {
        success: true,
        id: row.id,
        name: row.name,
        amountDollars: row.amountCents / 100,
      };
    },
  });

  const updateExpense = tool({
    description: "Update an existing expense's fields.",
    inputSchema: z.object({
      expenseId: z.string().describe("The expense ID to update"),
      name: z.string().optional(),
      type: z.enum(EXPENSE_TYPES).optional(),
      amountCents: z.number().int().min(0).optional(),
      billingPeriod: z.enum(BILLING_PERIODS).optional().nullable(),
      category: z.enum(EXPENSE_CATEGORIES).optional().nullable(),
    }),
    execute: async ({ expenseId, ...updates }) => {
      const existing = await db.query.expense.findFirst({
        where: eq(expense.id, expenseId),
      });
      if (!existing) {
        return { error: "Expense not found" };
      }

      const cleanUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          cleanUpdates[k] = v;
        }
      }
      if (Object.keys(cleanUpdates).length === 0) {
        return { error: "No fields to update" };
      }

      const [updated] = await db
        .update(expense)
        .set(cleanUpdates)
        .where(eq(expense.id, expenseId))
        .returning();

      return {
        success: true,
        id: updated.id,
        updatedFields: Object.keys(cleanUpdates),
      };
    },
  });

  const deleteExpense = tool({
    description: "Delete an expense by ID.",
    inputSchema: z.object({
      expenseId: z.string().describe("The expense ID to delete"),
    }),
    execute: async ({ expenseId }) => {
      const existing = await db.query.expense.findFirst({
        where: eq(expense.id, expenseId),
      });
      if (!existing) {
        return { error: "Expense not found" };
      }

      await db.delete(expense).where(eq(expense.id, expenseId));
      return { success: true, deletedName: existing.name };
    },
  });

  const updateCashOnHand = tool({
    description: "Update the cash on hand amount (in cents).",
    inputSchema: z.object({
      cashOnHandCents: z.number().int().describe("New cash on hand in cents"),
    }),
    execute: async ({ cashOnHandCents }) => {
      await ensureSnapshot();
      const [row] = await db
        .update(financialSnapshot)
        .set({ cashOnHandCents })
        .where(eq(financialSnapshot.id, "default"))
        .returning();

      return {
        success: true,
        cashOnHandDollars: row.cashOnHandCents / 100,
      };
    },
  });

  const getExpensesByCategory = tool({
    description:
      "Get monthly expense totals broken down by category. Useful for understanding where money goes.",
    inputSchema: z.object({}),
    execute: async () => {
      const activeExpenses = await db.query.expense.findMany({
        where: and(
          sql`(${expense.activeTo} IS NULL OR ${expense.activeTo} > now())`,
          sql`${expense.type} != 'one_time'`
        ),
      });

      const breakdown: Record<string, { monthlyCents: number; count: number }> =
        {};
      for (const e of activeExpenses) {
        const cat = e.category ?? "Other";
        const monthly =
          e.billingPeriod === "yearly"
            ? Math.round(e.amountCents / 12)
            : e.amountCents;
        if (!breakdown[cat]) {
          breakdown[cat] = { monthlyCents: 0, count: 0 };
        }
        breakdown[cat].monthlyCents += monthly;
        breakdown[cat].count += 1;
      }

      return {
        categories: Object.entries(breakdown)
          .map(([category, data]) => ({
            category,
            monthlyCents: data.monthlyCents,
            monthlyDollars: data.monthlyCents / 100,
            count: data.count,
          }))
          .sort((a, b) => b.monthlyCents - a.monthlyCents),
      };
    },
  });

  return {
    getFinancialOverview,
    queryExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    updateCashOnHand,
    getExpensesByCategory,
  };
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

export { createFinanceTools };
