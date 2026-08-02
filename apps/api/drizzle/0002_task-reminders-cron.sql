ALTER TABLE "tasks" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "tasks_reminder_at_pending_index" ON "tasks" USING btree ("reminder_at");
