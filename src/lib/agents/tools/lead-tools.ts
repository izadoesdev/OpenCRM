import { tool } from "ai";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { activity, lead } from "@/db/schema";
import { LEAD_PLANS, LEAD_STATUSES } from "@/lib/constants";
import { computeLeadScoreBreakdown, type ScoringInput } from "@/lib/scoring";
import { fireWebhooks } from "@/lib/webhook-dispatch";
import type { AgentContext } from "../types";

function createLeadTools(ctx: AgentContext) {
  const createLead = tool({
    description:
      "Create a new lead in the CRM. Use sensible defaults: status='new', source='manual', value=0. Returns the created lead with its ID.",
    inputSchema: z.object({
      name: z.string().describe("Full name"),
      email: z.string().describe("Email address"),
      company: z.string().optional().describe("Company name"),
      title: z.string().optional().describe("Job title"),
      phone: z.string().optional().describe("Phone number"),
      website: z.string().optional().describe("Website URL"),
      country: z.string().optional().describe("Country"),
      source: z
        .enum([
          "manual",
          "website",
          "referral",
          "linkedin",
          "cold_email",
          "api",
          "other",
        ])
        .optional()
        .describe("Lead source (default: manual)"),
      status: z
        .enum(LEAD_STATUSES)
        .optional()
        .describe("Pipeline status (default: new)"),
      plan: z.enum(LEAD_PLANS).optional().describe("Plan tier"),
      valueCents: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Deal value in cents (default: 0)"),
    }),
    execute: async ({
      name,
      email,
      company,
      title,
      phone,
      website,
      country,
      source,
      status,
      plan,
      valueCents,
    }) => {
      const existing = await db.query.lead.findFirst({
        where: eq(lead.email, email),
        columns: { id: true, name: true, email: true, status: true },
      });
      if (existing) {
        return {
          error: "A lead with this email already exists",
          existingLead: existing,
        };
      }

      const [created] = await db
        .insert(lead)
        .values({
          name,
          email,
          company,
          title,
          phone,
          website,
          country,
          source: source ?? "manual",
          status: status ?? "new",
          plan,
          value: valueCents ?? 0,
        })
        .returning();

      await db.insert(activity).values({
        leadId: created.id,
        userId: ctx.userId,
        type: "lead_created",
        content: "Lead created by agent",
      });

      fireWebhooks("lead.created", {
        id: created.id,
        name: created.name,
        email: created.email,
      });

      return {
        success: true,
        id: created.id,
        name: created.name,
        email: created.email,
        company: created.company,
        status: created.status,
        valueDollars: created.value / 100,
      };
    },
  });

  const queryLeads = tool({
    description:
      "Search and filter leads. Returns a summary list. Use this to find leads by status, source, search term, or to list all leads.",
    inputSchema: z.object({
      status: z
        .enum(LEAD_STATUSES)
        .optional()
        .describe("Filter by pipeline status"),
      search: z
        .string()
        .optional()
        .describe("Search by name, email, or company"),
      sort: z
        .enum(["createdAt", "value", "name", "status"])
        .optional()
        .describe("Field to sort by"),
      order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max results (default 50)"),
    }),
    execute: async ({ status, search, sort, order, limit }) => {
      const conditions = [isNull(lead.archivedAt)];

      if (status) {
        conditions.push(eq(lead.status, status));
      }
      if (search) {
        const term = `%${search}%`;
        const searchCond = or(
          ilike(lead.name, term),
          ilike(lead.email, term),
          ilike(lead.company, term)
        );
        if (searchCond) {
          conditions.push(searchCond);
        }
      }

      const sortMap = {
        value: lead.value,
        name: lead.name,
        status: lead.status,
        createdAt: lead.createdAt,
      } as const;
      const sortCol = sortMap[sort ?? "createdAt"];
      const orderFn = order === "asc" ? asc : desc;

      const rows = await db.query.lead.findMany({
        where: and(...conditions),
        orderBy: [orderFn(sortCol)],
        limit: limit ?? 50,
        columns: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
          source: true,
          value: true,
          plan: true,
          customFields: true,
          createdAt: true,
        },
      });

      return {
        count: rows.length,
        leads: rows.map((r) => ({
          ...r,
          valueDollars: r.value / 100,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  });

  const getLeadDetails = tool({
    description:
      "Get full details for a specific lead including activities, tasks, and assignment. Use when you need deep info on one lead.",
    inputSchema: z.object({
      leadId: z.string().describe("The lead ID"),
    }),
    execute: async ({ leadId }) => {
      const row = await db.query.lead.findFirst({
        where: eq(lead.id, leadId),
        with: {
          activities: {
            orderBy: [desc(activity.createdAt)],
            limit: 20,
          },
          tasks: true,
          assignedUser: { columns: { id: true, name: true, email: true } },
        },
      });

      if (!row) {
        return { error: "Lead not found" };
      }

      return {
        ...row,
        valueDollars: row.value / 100,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        activitiesCount: row.activities.length,
        tasksCount: row.tasks.length,
      };
    },
  });

  const updateLeadFields = tool({
    description:
      "Update fields on a lead. Can change status, value, plan, customFields (for tags), and more.",
    inputSchema: z.object({
      leadId: z.string().describe("The lead ID to update"),
      status: z.enum(LEAD_STATUSES).optional().describe("New pipeline status"),
      value: z.number().int().min(0).optional().describe("Deal value in cents"),
      plan: z.enum(LEAD_PLANS).optional().describe("Plan tier"),
      customFields: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Custom fields (use for tags, segments, etc). Merges with existing fields."
        ),
    }),
    execute: async ({ leadId, status, value, plan, customFields }) => {
      const existing = await db.query.lead.findFirst({
        where: eq(lead.id, leadId),
        columns: { id: true, customFields: true, status: true },
      });
      if (!existing) {
        return { error: "Lead not found" };
      }

      const updates: Record<string, unknown> = {};
      if (status !== undefined) {
        updates.status = status;
      }
      if (value !== undefined) {
        updates.value = value;
      }
      if (plan !== undefined) {
        updates.plan = plan;
      }
      if (customFields) {
        updates.customFields = {
          ...((existing.customFields as Record<string, string>) ?? {}),
          ...customFields,
        };
      }

      if (Object.keys(updates).length === 0) {
        return { error: "No fields to update" };
      }

      const [updated] = await db
        .update(lead)
        .set(updates)
        .where(eq(lead.id, leadId))
        .returning();

      if (status && status !== existing.status) {
        await db.insert(activity).values({
          leadId,
          userId: ctx.userId,
          type: "status_change",
          content: `Status changed to ${status} (by agent)`,
          metadata: { oldStatus: existing.status, newStatus: status },
        });
        fireWebhooks("lead.status_changed", {
          id: leadId,
          oldStatus: existing.status,
          newStatus: status,
        });
      }

      fireWebhooks("lead.updated", {
        id: updated.id,
        name: updated.name,
        changes: Object.keys(updates),
      });

      return {
        success: true,
        id: updated.id,
        updatedFields: Object.keys(updates),
      };
    },
  });

  const scoreLead = tool({
    description:
      "Compute the lead score (0-100) with a full breakdown of factors. Returns score, label (Hot/Warm/Cold), and factor details.",
    inputSchema: z.object({
      leadId: z.string().describe("The lead ID to score"),
    }),
    execute: async ({ leadId }) => {
      const row = await db.query.lead.findFirst({
        where: eq(lead.id, leadId),
        with: {
          activities: { columns: { id: true } },
          tasks: { columns: { id: true } },
        },
      });
      if (!row) {
        return { error: "Lead not found" };
      }

      const daysSinceCreated = Math.floor(
        (Date.now() - row.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const input: ScoringInput = {
        activitiesCount: row.activities.length,
        daysSinceCreated,
        status: row.status,
        tasksCount: row.tasks.length,
        value: row.value,
      };

      return computeLeadScoreBreakdown(input);
    },
  });

  const bulkUpdateStatus = tool({
    description:
      "Change the status of multiple leads at once. Use for batch operations.",
    inputSchema: z.object({
      leadIds: z.array(z.string()).min(1).max(50).describe("Array of lead IDs"),
      status: z.enum(LEAD_STATUSES).describe("New status for all leads"),
    }),
    execute: async ({ leadIds, status }) => {
      await db.transaction(async (tx) => {
        await tx.update(lead).set({ status }).where(inArray(lead.id, leadIds));

        await tx.insert(activity).values(
          leadIds.map((id) => ({
            leadId: id,
            userId: ctx.userId,
            type: "status_change" as const,
            content: `Status changed to ${status} (by agent)`,
            metadata: { newStatus: status },
          }))
        );
      });

      return { success: true, updatedCount: leadIds.length, newStatus: status };
    },
  });

  const getLeadCounts = tool({
    description:
      "Get a count of leads grouped by pipeline status. Useful for understanding the funnel.",
    inputSchema: z.object({}),
    execute: async () => {
      const rows = await db
        .select({
          status: lead.status,
          count: sql<number>`count(*)::int`,
        })
        .from(lead)
        .where(isNull(lead.archivedAt))
        .groupBy(lead.status);

      const counts: Record<string, number> = {};
      let total = 0;
      for (const r of rows) {
        counts[r.status] = r.count;
        total += r.count;
      }
      counts.all = total;
      return counts;
    },
  });

  return {
    createLead,
    queryLeads,
    getLeadDetails,
    updateLeadFields,
    scoreLead,
    bulkUpdateStatus,
    getLeadCounts,
  };
}

export { createLeadTools };
