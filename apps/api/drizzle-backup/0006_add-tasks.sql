CREATE TYPE "public"."task_status" AS ENUM('backlog', 'todo', 'in_progress', 'in_review', 'done');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"assignee_member_id" uuid,
	"task_number" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"position" integer DEFAULT 1000 NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_task_number_positive_check" CHECK ("tasks"."task_number" > 0),
	CONSTRAINT "tasks_position_non_negative_check" CHECK ("tasks"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_member_id_workspace_members_id_fk" FOREIGN KEY ("assignee_member_id") REFERENCES "public"."workspace_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_project_task_number_unique_index" ON "tasks" USING btree ("project_id","task_number");--> statement-breakpoint
CREATE INDEX "tasks_workspace_id_index" ON "tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_index" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_project_status_position_index" ON "tasks" USING btree ("project_id","status","position");--> statement-breakpoint
CREATE INDEX "tasks_workspace_assignee_index" ON "tasks" USING btree ("workspace_id","assignee_member_id");--> statement-breakpoint
CREATE INDEX "tasks_workspace_priority_index" ON "tasks" USING btree ("workspace_id","priority");--> statement-breakpoint
CREATE INDEX "tasks_due_at_index" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "tasks_created_by_user_id_index" ON "tasks" USING btree ("created_by_user_id");