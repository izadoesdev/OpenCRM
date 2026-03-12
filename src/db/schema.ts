import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ── Auth tables ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// ── CRM tables ──

export const lead = pgTable(
  "lead",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    title: text("title"),
    phone: text("phone"),
    website: text("website"),
    source: text("source").notNull().default("manual"),
    status: text("status").notNull().default("new"),
    plan: text("plan"),
    value: integer("value").default(0).notNull(),
    assignedTo: text("assigned_to").references(() => user.id, {
      onDelete: "set null",
    }),
    convertedAt: timestamp("converted_at"),
    churnedAt: timestamp("churned_at"),
    lostAt: timestamp("lost_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("lead_status_idx").on(table.status),
    index("lead_assignedTo_idx").on(table.assignedTo),
    index("lead_email_idx").on(table.email),
  ]
);

export const activity = pgTable(
  "activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    leadId: text("lead_id")
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    content: text("content"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_leadId_idx").on(table.leadId),
    index("activity_createdAt_idx").on(table.createdAt),
  ]
);

export const task = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    leadId: text("lead_id")
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at").notNull(),
    completedAt: timestamp("completed_at"),
    type: text("type").notNull().default("follow_up"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_leadId_idx").on(table.leadId),
    index("task_userId_idx").on(table.userId),
    index("task_dueAt_idx").on(table.dueAt),
  ]
);

export const emailTemplate = pgTable("email_template", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ── Relations ──

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  leads: many(lead),
  activities: many(activity),
  tasks: many(task),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const leadRelations = relations(lead, ({ one, many }) => ({
  assignedUser: one(user, {
    fields: [lead.assignedTo],
    references: [user.id],
  }),
  activities: many(activity),
  tasks: many(task),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  lead: one(lead, {
    fields: [activity.leadId],
    references: [lead.id],
  }),
  user: one(user, {
    fields: [activity.userId],
    references: [user.id],
  }),
}));

export const taskRelations = relations(task, ({ one }) => ({
  lead: one(lead, {
    fields: [task.leadId],
    references: [lead.id],
  }),
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
}));

export const emailTemplateRelations = relations(emailTemplate, ({ one }) => ({
  creator: one(user, {
    fields: [emailTemplate.createdBy],
    references: [user.id],
  }),
}));
