ALTER TABLE "tasks" ADD COLUMN "image_key" varchar(1024);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "image_original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "image_content_type" varchar(100);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "image_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_image_size_positive_check" CHECK ("tasks"."image_size_bytes" IS NULL OR "tasks"."image_size_bytes" > 0);