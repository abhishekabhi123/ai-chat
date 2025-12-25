import { Router } from "express";
import { postChatMessageSchema } from "./chat.schema.js";
import {
  fetchHistory,
  getOrCreateConversation,
  generateReply,
  persistMessage,
} from "./chat.service.js";

export const chatRouter = Router();

chatRouter.post("/chat/message", async (req, res, next) => {
  try {
    const parsed = postChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { message, sessionId } = parsed.data;
    const conversationId = await getOrCreateConversation(sessionId);

    await persistMessage(conversationId, "user", message);

    const history = await fetchHistory(conversationId, 20);

    let reply: string;
    try {
      reply = await generateReply(history, message);
    } catch {
      reply =
        "Sorry—our support agent is having trouble right now. Please try again in a moment.";
    }

    await persistMessage(conversationId, "ai", reply);

    return res.json({ reply, sessionId: conversationId });
  } catch (e) {
    next(e);
  }
});
