CREATE TYPE "public"."project_column_kind" AS ENUM('backlog', 'active', 'done');--> statement-breakpoint
ALTER TYPE "public"."task_status" RENAME TO "project_column_color";--> statement-breakpoint
CREATE TABLE "project_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" "project_column_color" DEFAULT 'slate' NOT NULL,
	"kind" "project_column_kind" DEFAULT 'active' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_columns_position_non_negative_check" CHECK ("project_columns"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "status" TO "column_id";--> statement-breakpoint
ALTER TABLE "project_columns" ALTER COLUMN "color" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_columns" ALTER COLUMN "color" SET DEFAULT 'slate'::text;--> statement-breakpoint
DROP TYPE "public"."project_column_color";--> statement-breakpoint
CREATE TYPE "public"."project_column_color" AS ENUM('slate', 'blue', 'violet', 'amber', 'emerald', 'rose', 'cyan', 'indigo');--> statement-breakpoint
ALTER TABLE "project_columns" ALTER COLUMN "color" SET DEFAULT 'slate'::"public"."project_column_color";--> statement-breakpoint
ALTER TABLE "project_columns" ALTER COLUMN "color" SET DATA TYPE "public"."project_column_color" USING "color"::"public"."project_column_color";--> statement-breakpoint
DROP INDEX "tasks_project_status_position_index";--> statement-breakpoint
ALTER TABLE "project_columns" ADD CONSTRAINT "project_columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_columns_project_name_unique_index" ON "project_columns" USING btree ("project_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "project_columns_project_position_unique_index" ON "project_columns" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "project_columns_project_id_id_unique_index" ON "project_columns" USING btree ("project_id","id");--> statement-breakpoint
CREATE INDEX "project_columns_project_id_index" ON "project_columns" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_column_foreign_key" FOREIGN KEY ("project_id","column_id") REFERENCES "public"."project_columns"("project_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_project_column_position_index" ON "tasks" USING btree ("project_id","column_id","position");