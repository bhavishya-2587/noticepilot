import { z } from "zod";

const nonEmptyTrimmedString = z.string().trim().min(1);

const notSpecifiedFieldSchema = z
  .object({
    status: z.literal("not_specified"),
  })
  .strict();

const uncertainFieldSchema = z
  .object({
    status: z.literal("uncertain"),
    value: nonEmptyTrimmedString.optional(),
    explanation: nonEmptyTrimmedString,
  })
  .strict();

const presentTextFieldSchema = z
  .object({
    status: z.literal("present"),
    value: nonEmptyTrimmedString,
  })
  .strict();

export const textFieldSchema = z.discriminatedUnion("status", [
  presentTextFieldSchema,
  notSpecifiedFieldSchema,
  uncertainFieldSchema,
]);

const datePresentSchema = z
  .object({
    status: z.literal("present"),
    raw: nonEmptyTrimmedString,
    normalized: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Normalized dates must use YYYY-MM-DD format.",
      )
      .optional(),
  })
  .strict();

const dateUncertainSchema = z
  .object({
    status: z.literal("uncertain"),
    raw: nonEmptyTrimmedString,
    normalized: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Normalized dates must use YYYY-MM-DD format.",
      )
      .optional(),
    explanation: nonEmptyTrimmedString,
  })
  .strict();

const dateNotSpecifiedSchema = z
  .object({
    status: z.literal("not_specified"),
  })
  .strict();

export const dateFieldSchema = z.discriminatedUnion("status", [
  datePresentSchema,
  dateUncertainSchema,
  dateNotSpecifiedSchema,
]);

export const timeFieldSchema = z.discriminatedUnion("status", [
  presentTextFieldSchema,
  notSpecifiedFieldSchema,
  uncertainFieldSchema,
]);

export const locationFieldSchema = z.discriminatedUnion("status", [
  presentTextFieldSchema,
  notSpecifiedFieldSchema,
  uncertainFieldSchema,
]);

export const actionRequiredSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("present"),
      value: z.enum(["required", "optional", "not_applicable"]),
    })
    .strict(),
  z
    .object({
      status: z.literal("not_specified"),
    })
    .strict(),
  z
    .object({
      status: z.literal("uncertain"),
      value: z.enum(["required", "optional", "not_applicable"]).optional(),
      explanation: nonEmptyTrimmedString,
    })
    .strict(),
]);

export const evidenceSchema = z
  .object({
    sourceSegmentId: nonEmptyTrimmedString,
    quote: nonEmptyTrimmedString,
  })
  .strict();

export const uncertaintySchema = z
  .object({
    reason: nonEmptyTrimmedString,
  })
  .strict();

const noticeTitleSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (title) => title.split(/\s+/).length <= 4,
    "Notice title must contain no more than 4 words.",
  );

export const noticeItemSchema = z
  .object({
    type: z.enum(["deadline", "event", "task", "requirement"]),
    title: nonEmptyTrimmedString,
    description: nonEmptyTrimmedString,
    date: dateFieldSchema,
    time: timeFieldSchema,
    location: locationFieldSchema,
    actionRequired: actionRequiredSchema,
    uncertainty: uncertaintySchema.optional(),
    evidence: z.array(evidenceSchema).min(1).max(10),
  })
  .strict();

export const intelligenceResultSchema = z
  .object({
    notice: z
      .object({
        title: noticeTitleSchema,
        audience: textFieldSchema,
        summary: nonEmptyTrimmedString,
        issuer: textFieldSchema,
      })
      .strict(),

    items: z.array(noticeItemSchema).max(50),
  })
  .strict();

export type TextField = z.infer<typeof textFieldSchema>;
export type DateField = z.infer<typeof dateFieldSchema>;
export type TimeField = z.infer<typeof timeFieldSchema>;
export type LocationField = z.infer<typeof locationFieldSchema>;
export type ActionRequired = z.infer<typeof actionRequiredSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Uncertainty = z.infer<typeof uncertaintySchema>;
export type NoticeItem = z.infer<typeof noticeItemSchema>;
export type IntelligenceResult = z.infer<typeof intelligenceResultSchema>;

export type IntelligenceValidationResult =
  | {
      success: true;
      data: IntelligenceResult;
    }
  | {
      success: false;
      error: z.ZodError;
    };

export function validateIntelligenceResult(
  value: unknown,
): IntelligenceValidationResult {
  const result = intelligenceResultSchema.safeParse(value);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}