import { z } from "zod";

export const DispositionTypeEnum = z.enum(["OPEN", "CLOSED"]);
export const ExecutionStatusEnum = z.enum(["WAITING", "IN_PROGRESS", "COMPLETED"]);

export const createDispositionSchema = z.object({
  documentId: z.string().uuid(),
  parentDispositionId: z.string().uuid().optional(),
  toPositionId: z.string().uuid(),
  dispositionType: DispositionTypeEnum.default("OPEN"),
  actionChecklist: z.array(z.string()).min(1, "At least one action must be specified"),
  instructionNotes: z.string().optional(),
  deadline: z.string().datetime().optional(), // ISO 8601 string
});

export type CreateDispositionInput = z.infer<typeof createDispositionSchema>;

export const updateExecutionStatusSchema = z.object({
  dispositionId: z.string().uuid(),
  executionStatus: ExecutionStatusEnum,
  completionReport: z.string().optional(),
});

export type UpdateExecutionStatusInput = z.infer<typeof updateExecutionStatusSchema>;
