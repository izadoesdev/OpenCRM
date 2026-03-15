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

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  preferences: jsonb("preferences")
    .$type<{
      digestEnabled?: boolean;
      timezone?: string;
      dateFormat?: string;
    }>()
    .default({}),
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

// ── API keys ──

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_key_keyHash_idx").on(table.keyHash),
    index("api_key_createdBy_idx").on(table.createdBy),
  ]
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
    country: text("country"),
    timezone: text("timezone"),
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
    customFields: jsonb("custom_fields")
      .$type<Record<string, string>>()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("lead_status_idx").on(table.status),
    index("lead_archivedAt_idx").on(table.archivedAt),
    index("lead_assignedTo_idx").on(table.assignedTo),
    index("lead_email_idx").on(table.email),
    index("lead_createdAt_idx").on(table.createdAt),
    index("lead_archivedAt_status_idx").on(table.archivedAt, table.status),
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
    index("activity_type_idx").on(table.type),
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
    recurrence: text("recurrence"),
    meetingLink: text("meeting_link"),
    calendarEventId: text("calendar_event_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_leadId_idx").on(table.leadId),
    index("task_userId_idx").on(table.userId),
    index("task_dueAt_idx").on(table.dueAt),
    index("task_completedAt_dueAt_idx").on(table.completedAt, table.dueAt),
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

// ── App settings (singleton) ──

export const appSettings = pgTable("app_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => "default"),
  currency: text("currency").notNull().default("USD"),
  dateFormat: text("date_format").notNull().default("MM/DD/YYYY"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const customFieldDefinition = pgTable("custom_field_definition", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  required: boolean("required").default(false).notNull(),
  options: jsonb("options").$type<string[]>().default([]),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhook = pgTable(
  "webhook",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    url: text("url").notNull(),
    events: jsonb("events").$type<string[]>().notNull().default([]),
    secret: text("secret").notNull(),
    active: boolean("active").default(true).notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("webhook_createdBy_idx").on(table.createdBy)]
);

// ── Relations ──

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  leads: many(lead),
  activities: many(activity),
  tasks: many(task),
  apiKeys: many(apiKey),
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

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  creator: one(user, {
    fields: [apiKey.createdBy],
    references: [user.id],
  }),
}));

export const webhookRelations = relations(webhook, ({ one }) => ({
  creator: one(user, {
    fields: [webhook.createdBy],
    references: [user.id],
  }),
}));
