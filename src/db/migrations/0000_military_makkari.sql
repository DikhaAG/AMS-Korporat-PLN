CREATE EXTENSION IF NOT EXISTS ltree;--> statement-breakpoint
CREATE TYPE "public"."delegation_type" AS ENUM('PLH', 'PLT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"title" varchar NOT NULL,
	"parent_id" uuid,
	"unit_id" uuid,
	"is_signer" boolean DEFAULT false,
	"hierarchy_path" "ltree" NOT NULL,
	CONSTRAINT "org_positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "position_delegations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delegator_position_id" uuid NOT NULL,
	"delegatee_user_id" text NOT NULL,
	"delegation_type" "delegation_type" NOT NULL,
	"assignment_letter_ref" varchar,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"nip" varchar,
	"position_id" uuid,
	"signature_passphrase_hash" varchar,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_nip_unique" UNIQUE("nip")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_delegations" ADD CONSTRAINT "position_delegations_delegator_position_id_org_positions_id_fk" FOREIGN KEY ("delegator_position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_delegations" ADD CONSTRAINT "position_delegations_delegatee_user_id_user_id_fk" FOREIGN KEY ("delegatee_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_position_id_org_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."org_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_positions_path_gist_idx" ON "org_positions" USING GIST ("hierarchy_path");