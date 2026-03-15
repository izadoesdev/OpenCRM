CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_stages" jsonb DEFAULT '[]'::jsonb,
	"lead_sources" jsonb DEFAULT '[]'::jsonb,
	"email_from_name" text,
	"email_reply_to" text,
	"email_signature" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"date_format" text DEFAULT 'MM/DD/YYYY' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_createdBy_idx" ON "webhook" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "activity_type_idx" ON "activity" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lead_createdAt_idx" ON "lead" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_archivedAt_status_idx" ON "lead" USING btree ("archived_at","status");--> statement-breakpoint
CREATE INDEX "task_completedAt_dueAt_idx" ON "task" USING btree ("completed_at","due_at");