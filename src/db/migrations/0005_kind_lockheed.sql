CREATE TYPE "public"."document_recipient_type" AS ENUM('PRIMARY', 'CC');--> statement-breakpoint
CREATE TYPE "public"."transmission_mode" AS ENUM('DISPOSITION', 'FORWARD');--> statement-breakpoint
CREATE TABLE "document_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"recipient_type" "document_recipient_type" DEFAULT 'PRIMARY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "dispositions" ADD COLUMN "transmission_mode" "transmission_mode" DEFAULT 'DISPOSITION' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_recipients" ADD CONSTRAINT "document_recipients_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_recipients" ADD CONSTRAINT "document_recipients_position_id_org_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;