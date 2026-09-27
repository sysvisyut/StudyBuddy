CREATE TABLE "studyTypeContent" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"content" json NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating',
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "study_material" ADD COLUMN "status" varchar DEFAULT 'Generating';--> statement-breakpoint
ALTER TABLE "study_material" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeSubscriptionId" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_study_type_content_course_id" ON "studyTypeContent" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "idx_study_type_content_course_type" ON "studyTypeContent" USING btree ("courseId","type");--> statement-breakpoint
CREATE INDEX "idx_chapter_notes_course_id" ON "chapterNotes" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_study_material_course_id" ON "study_material" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "idx_study_material_created_by" ON "study_material" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "idx_study_material_status" ON "study_material" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");