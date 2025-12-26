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
    } catch (err: any) {
      console.error("OpenAI error:", err);

      const status = err?.status;
      const code = err?.code;

      if (status === 429 && code === "insufficient_quota") {
        reply =
          "AI agent is unavailable because the server has no LLM quota/billing configured. Please try again later.";
      } else if (status === 429) {
        reply =
          "AI agent is busy right now (rate limited). Please wait a few seconds and retry.";
      } else {
        reply =
          "Sorry—our support agent is having trouble right now. Please try again in a moment.";
      }
    }

    await persistMessage(conversationId, "ai", reply);

    return res.json({ reply, sessionId: conversationId });
  } catch (e) {
    next(e);
  }
});

chatRouter.get("/chat/history", async (req, res, next) => {
  try {
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId)
      return res.status(400).json({ error: "sessionId is required" });

    const history = await fetchHistory(sessionId, 200);
    return res.json({ sessionId, messages: history });
  } catch (e) {
    next(e);
  }
});
