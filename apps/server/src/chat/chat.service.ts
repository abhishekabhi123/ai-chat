import { pool } from "../db/pool.js";
import { openai } from "../llm/openai.js";
import { SYSTEM_PROMPT } from "../llm/prompt.js";

type Sender = "user" | "ai";

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

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.2,
    max_tokens: 300,
  });

  return (
    res.choices[0]?.message?.content?.trim() || "Sorry—could you rephrase that?"
  );
}
