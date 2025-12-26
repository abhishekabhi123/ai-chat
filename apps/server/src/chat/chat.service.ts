import { pool } from "../db/pool.js";
import { llmClient } from "../llm/openai.js";
import { SYSTEM_PROMPT } from "../llm/prompt.js";
import { redis, isRedisReady } from "../redis/client.js";

type Sender = "user" | "ai";

function historyCacheKey(conversationId: string) {
  return `history:v1:${conversationId}`;
}
export async function fetchHistoryCached(conversationId: string, limit = 200) {
  if (isRedisReady()) {
    const cached = await redis!.get(historyCacheKey(conversationId));
    if (cached)
      return JSON.parse(cached) as Array<{ sender: Sender; text: string }>;
  }
  const fresh = await fetchHistory(conversationId, limit);

  if (isRedisReady()) {
    // cache for 15 seconds (short TTL keeps it safe + fresh)
    await redis!.set(historyCacheKey(conversationId), JSON.stringify(fresh), {
      EX: 15,
    });
  }
  return fresh;
}

export async function invalidateHistoryCache(conversationId: string) {
  if (!isRedisReady()) return;
  await redis!.del(historyCacheKey(conversationId));
}

export async function getOrCreateConversation(sessionId?: string) {
  if (sessionId) {
    const existing = await pool.query(
      `select id from conversations where id = $1`,
      [sessionId]
    );
    if (existing.rowCount === 1) return sessionId;
  }
  const created = await pool.query(
    `insert into conversations default values returning id`
  );
  return created.rows[0].id as string;
}

export async function fetchHistory(conversationId: string, limit = 20) {
  const res = await pool.query(
    `select sender, text
     from messages
     where conversation_id = $1
     order by created_at asc
     limit $2`,
    [conversationId, limit]
  );
  return res.rows as Array<{ sender: Sender; text: string }>;
}

export async function persistMessage(
  conversationId: string,
  sender: Sender,
  text: string
) {
  await pool.query(
    `insert into messages (conversation_id, sender, text) values ($1, $2, $3)`,
    [conversationId, sender, text]
  );
}

export async function generateReply(
  history: Array<{ sender: Sender; text: string }>,
  userMessage: string
) {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const res = await llmClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.2,
    max_tokens: 300,
  });

  return (
    res.choices[0]?.message?.content?.trim() || "Sorry—could you rephrase that?"
  );
}
