import { z } from "zod";

export const attitudeSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const reviewBodySchema = z.object({
  attitude: z.coerce.number().pipe(attitudeSchema),
  comment: z.string().trim().min(1).max(100),
  turnstileToken: z.string().trim().min(1).max(2048),
});

const optionalIntegerSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().int().min(0).max(1000).nullable()
);

export const createClassBodySchema = z.object({
  term: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  credits: optionalIntegerSchema,
  hours: optionalIntegerSchema,
  category: z.string().trim().min(1).max(40),
  method: z.string().trim().min(1).max(40),
  turnstileToken: z.string().trim().min(1).max(2048),
});

export const classIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const plainTextSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/[^\P{Cc}\t\n\r]/u.test(value), "不能包含控制字符");

export const siteCommentBodySchema = z.object({
  nickname: plainTextSchema.max(24).regex(/^[^\r\n]+$/u, "称呼不能换行"),
  body: plainTextSchema.max(300),
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const commentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(20).catch(8),
});

export type Attitude = z.infer<typeof attitudeSchema>;

export type ReviewBody = z.infer<typeof reviewBodySchema>;

export type CreateClassBody = z.infer<typeof createClassBodySchema>;

export type SiteCommentBody = z.infer<typeof siteCommentBodySchema>;

export type CommentsQuery = z.infer<typeof commentsQuerySchema>;
