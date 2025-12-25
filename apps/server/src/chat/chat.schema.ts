import { z } from "zod";

export const postChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long"),
  sessionId: z.string().uuid().optional(),
});
