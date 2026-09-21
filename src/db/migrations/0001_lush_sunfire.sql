CREATE TYPE "public"."action_status" AS ENUM('PENDING', 'APPROVED', 'REVISED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."approval_role" AS ENUM('INITIAL_DRAFTER', 'VERIFIER_PARAF', 'FINAL_SIGNER');--> statement-breakpoint
CREATE TYPE "public"."current_status" AS ENUM('DRAFT', 'IN_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'SIGNED_AND_PUBLISHED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('DINAS_NOTE', 'OUTGOING_LETTER', 'ASSIGNMENT_LETTER', 'CIRCULAR_LETTER');--> statement-breakpoint
CREATE TYPE "public"."security_level" AS ENUM('REGULAR', 'RESTRICTED', 'CONFIDENTIAL', 'TOP_SECRET');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('REGULAR', 'URGENT', 'FLASH');--> statement-breakpoint
CREATE TABLE "document_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"reviewer_position_id" uuid NOT NULL,
	"actual_reviewer_user_id" text,
	"step_order" integer NOT NULL,
	"approval_role" "approval_role" NOT NULL,
	"action_status" "action_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"acted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_audit_trails" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"event_type" varchar NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"state_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type" "document_type" NOT NULL,
	"document_number" varchar,
	"agenda_number" varchar,
	"classification_code" varchar,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"security_level" "security_level" DEFAULT 'REGULAR' NOT NULL,
	"urgency_level" "urgency_level" DEFAULT 'REGULAR' NOT NULL,
	"creator_user_id" text NOT NULL,
	"sender_position_id" uuid NOT NULL,
	"current_status" "current_status" DEFAULT 'DRAFT' NOT NULL,
	"retention_active_date" date,
	"retention_inactive_date" date,
	"final_pdf_path" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_reviewer_position_id_org_positions_id_fk" FOREIGN KEY ("reviewer_position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_actual_reviewer_user_id_user_id_fk" FOREIGN KEY ("actual_reviewer_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trails" ADD CONSTRAINT "document_audit_trails_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trails" ADD CONSTRAINT "document_audit_trails_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_sender_position_id_org_positions_id_fk" FOREIGN KEY ("sender_position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;