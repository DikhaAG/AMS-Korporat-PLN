CREATE TYPE "public"."disposition_type" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "dispositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_disposition_id" uuid,
	"from_position_id" uuid NOT NULL,
	"to_position_id" uuid NOT NULL,
	"disposition_type" "disposition_type" DEFAULT 'OPEN' NOT NULL,
	"action_checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instruction_notes" text,
	"deadline" timestamp with time zone,
	"execution_status" "execution_status" DEFAULT 'WAITING' NOT NULL,
	"completed_at" timestamp with time zone,
	"completion_report" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dispositions" ADD CONSTRAINT "dispositions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispositions" ADD CONSTRAINT "dispositions_from_position_id_org_positions_id_fk" FOREIGN KEY ("from_position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispositions" ADD CONSTRAINT "dispositions_to_position_id_org_positions_id_fk" FOREIGN KEY ("to_position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;