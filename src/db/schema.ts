import { pgTable, uuid, varchar, boolean, timestamp, text, customType, pgEnum, integer, jsonb, date, bigserial, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom ltree type for hierarchical paths
export const ltree = customType<{ data: string; driverData: string }>({
  dataType() {
    return "ltree";
  },
  toDriver(value: string) {
    return value;
  },
  fromDriver(value: unknown) {
    return value as string;
  },
});

export const delegationTypeEnum = pgEnum("delegation_type", ["PLH", "PLT"]);

export const orgPositions = pgTable("org_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code").unique().notNull(),
  title: varchar("title").notNull(),
  parentId: uuid("parent_id"), // self-reference handled in relations
  unitId: uuid("unit_id"),
  isSigner: boolean("is_signer").default(false),
  hierarchyPath: ltree("hierarchy_path").notNull(),
});

// Better Auth required tables + custom fields
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // custom extensions
  nip: varchar("nip").unique(),
  positionId: uuid("position_id").references(() => orgPositions.id),
  signaturePassphraseHash: varchar("signature_passphrase_hash"),
  role: text("role").notNull().default("user"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const positionDelegations = pgTable("position_delegations", {
  id: uuid("id").primaryKey().defaultRandom(),
  delegatorPositionId: uuid("delegator_position_id").references(() => orgPositions.id).notNull(),
  delegateeUserId: text("delegatee_user_id").references(() => user.id).notNull(),
  delegationType: delegationTypeEnum("delegation_type").notNull(),
  assignmentLetterRef: varchar("assignment_letter_ref"),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
});

export const userRelations = relations(user, ({ one, many }) => ({
  position: one(orgPositions, {
    fields: [user.positionId],
    references: [orgPositions.id],
  }),
  delegations: many(positionDelegations),
  documentsCreated: many(documents),
  documentApprovalsExecuted: many(documentApprovals),
  auditTrails: many(documentAuditTrails),
}));

export const orgPositionsRelations = relations(orgPositions, ({ one, many }) => ({
  parent: one(orgPositions, {
    fields: [orgPositions.parentId],
    references: [orgPositions.id],
  }),
  children: many(orgPositions),
  users: many(user),
  documentsSent: many(documents),
  documentApprovalsAssigned: many(documentApprovals),
}));

export const positionDelegationsRelations = relations(positionDelegations, ({ one }) => ({
  delegatorPosition: one(orgPositions, {
    fields: [positionDelegations.delegatorPositionId],
    references: [orgPositions.id],
  }),
  delegatee: one(user, {
    fields: [positionDelegations.delegateeUserId],
    references: [user.id],
  }),
}));

export const documentTypeEnum = pgEnum("document_type", ["DINAS_NOTE", "OUTGOING_LETTER", "ASSIGNMENT_LETTER", "CIRCULAR_LETTER"]);
export const securityLevelEnum = pgEnum("security_level", ["REGULAR", "RESTRICTED", "CONFIDENTIAL", "TOP_SECRET"]);
export const urgencyLevelEnum = pgEnum("urgency_level", ["REGULAR", "URGENT", "FLASH"]);
export const currentStatusEnum = pgEnum("current_status", ["DRAFT", "IN_REVIEW", "NEEDS_REVISION", "APPROVED", "SIGNED_AND_PUBLISHED", "REJECTED", "CANCELLED"]);
export const approvalRoleEnum = pgEnum("approval_role", ["INITIAL_DRAFTER", "VERIFIER_PARAF", "FINAL_SIGNER"]);
export const actionStatusEnum = pgEnum("action_status", ["PENDING", "APPROVED", "REVISED", "REJECTED"]);
export const dispositionTypeEnum = pgEnum("disposition_type", ["OPEN", "CLOSED"]);
export const transmissionModeEnum = pgEnum("transmission_mode", ["DISPOSITION", "FORWARD"]);
export const executionStatusEnum = pgEnum("execution_status", ["WAITING", "IN_PROGRESS", "COMPLETED"]);
export const documentRecipientTypeEnum = pgEnum("document_recipient_type", ["PRIMARY", "CC"]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentType: documentTypeEnum("document_type").notNull(),
  documentNumber: varchar("document_number"),
  agendaNumber: varchar("agenda_number"),
  classificationCode: varchar("classification_code"),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  securityLevel: securityLevelEnum("security_level").notNull().default("REGULAR"),
  urgencyLevel: urgencyLevelEnum("urgency_level").notNull().default("REGULAR"),
  creatorUserId: text("creator_user_id").references(() => user.id).notNull(),
  senderPositionId: uuid("sender_position_id").references(() => orgPositions.id).notNull(),
  currentStatus: currentStatusEnum("current_status").notNull().default("DRAFT"),
  isLocked: boolean("is_locked").notNull().default(false),
  retentionActiveDate: date("retention_active_date"),
  retentionInactiveDate: date("retention_inactive_date"),
  finalPdfPath: varchar("final_pdf_path"),
  sha256Hash: varchar("sha256_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentApprovals = pgTable("document_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  reviewerPositionId: uuid("reviewer_position_id").references(() => orgPositions.id).notNull(),
  actualReviewerUserId: text("actual_reviewer_user_id").references(() => user.id),
  stepOrder: integer("step_order").notNull(),
  approvalRole: approvalRoleEnum("approval_role").notNull(),
  actionStatus: actionStatusEnum("action_status").notNull().default("PENDING"),
  notes: text("notes"),
  actedAt: timestamp("acted_at", { withTimezone: true }),
});

export const documentAuditTrails = pgTable("document_audit_trails", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  documentId: uuid("document_id").references(() => documents.id).notNull(),
  actorUserId: text("actor_user_id").references(() => user.id).notNull(),
  eventType: varchar("event_type").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  statePayload: jsonb("state_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentRecipients = pgTable("document_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  positionId: uuid("position_id").references(() => orgPositions.id).notNull(),
  recipientType: documentRecipientTypeEnum("recipient_type").notNull().default("PRIMARY"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  creator: one(user, {
    fields: [documents.creatorUserId],
    references: [user.id],
  }),
  senderPosition: one(orgPositions, {
    fields: [documents.senderPositionId],
    references: [orgPositions.id],
  }),
  approvals: many(documentApprovals),
  auditTrails: many(documentAuditTrails),
  recipients: many(documentRecipients),
  dispositions: many(dispositions),
}));

export const documentApprovalsRelations = relations(documentApprovals, ({ one }) => ({
  document: one(documents, {
    fields: [documentApprovals.documentId],
    references: [documents.id],
  }),
  reviewerPosition: one(orgPositions, {
    fields: [documentApprovals.reviewerPositionId],
    references: [orgPositions.id],
  }),
  actualReviewerUser: one(user, {
    fields: [documentApprovals.actualReviewerUserId],
    references: [user.id],
  }),
}));

export const documentAuditTrailsRelations = relations(documentAuditTrails, ({ one }) => ({
  document: one(documents, {
    fields: [documentAuditTrails.documentId],
    references: [documents.id],
  }),
  actorUser: one(user, {
    fields: [documentAuditTrails.actorUserId],
    references: [user.id],
  }),
}));

export const documentRecipientsRelations = relations(documentRecipients, ({ one }) => ({
  document: one(documents, {
    fields: [documentRecipients.documentId],
    references: [documents.id],
  }),
  position: one(orgPositions, {
    fields: [documentRecipients.positionId],
    references: [orgPositions.id],
  }),
}));

export const documentCounters = pgTable("document_counters", {
  classificationCode: varchar("classification_code").notNull(),
  year: integer("year").notNull(),
  currentSequence: integer("current_sequence").notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.classificationCode, t.year] })
]);

export const dispositions = pgTable("dispositions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id).notNull(),
  // Cannot self-reference cleanly inline in drizzle for some pg functions, but works fine like this usually.
  parentDispositionId: uuid("parent_disposition_id"), // Added reference in relations
  fromPositionId: uuid("from_position_id").references(() => orgPositions.id).notNull(),
  toPositionId: uuid("to_position_id").references(() => orgPositions.id).notNull(),
  transmissionMode: transmissionModeEnum("transmission_mode").notNull().default("DISPOSITION"),
  dispositionType: dispositionTypeEnum("disposition_type").notNull().default("OPEN"),
  actionChecklist: jsonb("action_checklist").notNull().default([]), // array of strings
  instructionNotes: text("instruction_notes"),
  deadline: timestamp("deadline", { withTimezone: true }),
  executionStatus: executionStatusEnum("execution_status").notNull().default("WAITING"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completionReport: text("completion_report"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dispositionsRelations = relations(dispositions, ({ one, many }) => ({
  document: one(documents, {
    fields: [dispositions.documentId],
    references: [documents.id],
  }),
  parentDisposition: one(dispositions, {
    fields: [dispositions.parentDispositionId],
    references: [dispositions.id],
    relationName: "parent_child_dispositions",
  }),
  childDispositions: many(dispositions, {
    relationName: "parent_child_dispositions",
  }),
  fromPosition: one(orgPositions, {
    fields: [dispositions.fromPositionId],
    references: [orgPositions.id],
    relationName: "from_position",
  }),
  toPosition: one(orgPositions, {
    fields: [dispositions.toPositionId],
    references: [orgPositions.id],
    relationName: "to_position",
  }),
}));

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").unique().notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by").references(() => user.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByUser: one(user, {
    fields: [systemSettings.updatedBy],
    references: [user.id],
  }),
}));
