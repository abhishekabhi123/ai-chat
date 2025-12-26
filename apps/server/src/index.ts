import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chatRouter } from "./chat/chat.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(chatRouter);
app.use(errorHandler);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
