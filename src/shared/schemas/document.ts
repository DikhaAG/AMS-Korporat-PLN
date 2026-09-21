import { z } from "zod";

export const DocumentTypeEnum = z.enum([
  "DINAS_NOTE",
  "OUTGOING_LETTER",
  "ASSIGNMENT_LETTER",
  "CIRCULAR_LETTER",
]);

export const SecurityLevelEnum = z.enum([
  "REGULAR",
  "RESTRICTED",
  "CONFIDENTIAL",
  "TOP_SECRET",
]);

export const UrgencyLevelEnum = z.enum(["REGULAR", "URGENT", "FLASH"]);

export const DocumentStatusEnum = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "NEEDS_REVISION",
  "APPROVED",
  "SIGNED_AND_PUBLISHED",
  "REJECTED",
  "CANCELLED",
]);

// Schema for creating a new document draft
export const createDocumentDraftSchema = z.object({
  documentType: DocumentTypeEnum,
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  bodyHtml: z.string().min(10, "Document body must not be empty"),
  securityLevel: SecurityLevelEnum.default("REGULAR"),
  urgencyLevel: UrgencyLevelEnum.default("REGULAR"),
  agendaNumber: z.string().optional(),
  classificationCode: z.string().optional(),
  recipientPositionIds: z.array(z.string().uuid()).min(1, "At least one recipient is required"),
  ccPositionIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateDocumentDraftInput = z.infer<typeof createDocumentDraftSchema>;

// Schema for updating an existing document draft
export const updateDocumentDraftSchema = createDocumentDraftSchema.extend({
  documentId: z.string().uuid(),
});

export type UpdateDocumentDraftInput = z.infer<typeof updateDocumentDraftSchema>;

// Schema for document review action (Approve/Reject/Revise)
export const documentReviewActionSchema = z.object({
  documentId: z.string().uuid(),
  actionStatus: z.enum(["APPROVED", "REVISED", "REJECTED"]),
  notes: z.string().optional(),
});

export type DocumentReviewActionInput = z.infer<typeof documentReviewActionSchema>;

// Schema for fetching documents (Inbox/Outbox)
export const getDocumentsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: DocumentStatusEnum.optional(),
  search: z.string().optional(),
  type: z.enum(["INBOX", "OUTBOX"]).default("INBOX"),
});

export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>;

export const getDocumentSchema = z.object({
  id: z.string().uuid(),
});

export const dispositionActionSchema = z.object({
  documentId: z.string().uuid(),
  toPositionId: z.string().uuid(),
  transmissionMode: z.enum(["DISPOSITION", "FORWARD"]).default("DISPOSITION"),
  dispositionType: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
  actionChecklist: z.array(z.string()).default([]),
  instructionNotes: z.string().optional(),
  deadline: z.string().optional(),
});

export type DispositionActionInput = z.infer<typeof dispositionActionSchema>;
