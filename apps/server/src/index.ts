import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chatRouter } from "./chat/chat.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ConnectRedisIfConfigured } from "./redis/client.js";

dotenv.config();

await ConnectRedisIfConfigured().catch((e) => {
  // console.error("Redis not available, continuing without cache", e);
});

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(chatRouter);
app.use(errorHandler);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
