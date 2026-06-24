import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  chatId: z.string().uuid().optional(),
  mode: z.enum(["answer", "socratic"]).default("answer"),
});

export const documentIdSchema = z.string().uuid();

export type ChatRequestBody = z.infer<typeof chatRequestSchema>;
