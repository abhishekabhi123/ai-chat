import { rateLimit } from "express-rate-limit";

export const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // 20 requests/min per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
    });
  },
});
