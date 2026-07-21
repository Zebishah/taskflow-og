DROP INDEX "workspaces_slug_unique_idx";--> statement-breakpoint
DROP INDEX "workspaces_created_at_idx";--> statement-breakpoint
DROP INDEX "workspace_members_workspace_user_unique_idx";--> statement-breakpoint
DROP INDEX "workspace_members_workspace_id_idx";--> statement-breakpoint
DROP INDEX "workspace_members_user_id_idx";--> statement-breakpoint
DROP INDEX "workspace_members_role_idx";--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "slug" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique_index" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_created_at_index" ON "workspaces" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique_index" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_index" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_index" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_role_index" ON "workspace_members" USING btree ("workspace_id","role");