import { Router } from "express";
import { postChatMessageSchema } from "./chat.schema.js";
import {
  fetchHistory,
  getOrCreateConversation,
  generateReply,
  persistMessage,
} from "./chat.service.js";
import { chatMessageLimiter } from "../middleware/rateLimit.js";
import { HttpError } from "../lib/httpError.js";
import { fetchHistoryCached, invalidateHistoryCache } from "./chat.service.js";

export const chatRouter = Router();

chatRouter.post("/chat/message", chatMessageLimiter, async (req, res, next) => {
  try {
    const parsed = postChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid request body", parsed.error.flatten());
    }

    const { message, sessionId } = parsed.data;
    const conversationId = await getOrCreateConversation(sessionId);

    await persistMessage(conversationId, "user", message);
    await invalidateHistoryCache(conversationId);

    const history = await fetchHistory(conversationId, 20);

    let reply: string;
    try {
      reply = await generateReply(history, message);
    } catch (err: any) {
      console.error("LLM error:", err);

      const status = err?.status;

      if (status === 429) {
        reply =
          "AI agent is busy right now (rate limited). Please wait a few seconds and retry.";
      } else if (status === 401 || status === 403) {
        reply =
          "AI agent is misconfigured on the server (auth). Please try again later.";
      } else {
        reply =
          "Sorry—our support agent is having trouble right now. Please try again in a moment.";
      }
    }

    await persistMessage(conversationId, "ai", reply);

    await invalidateHistoryCache(conversationId);

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

    const history = await fetchHistoryCached(sessionId, 200);

    return res.json({ sessionId, messages: history });
  } catch (e) {
    next(e);
  }
});
