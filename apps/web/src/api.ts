export type Sender = "user" | "ai";

export type HistoryResponse = {
  sessionId: string;
  messages: Array<{ sender: Sender; text: string }>;
};

export async function fetchHistory(
  sessionId: string
): Promise<HistoryResponse> {
  const res = await fetch(
    `/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`
  );
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function sendMessage(message: string, sessionId?: string) {
  const res = await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error ? JSON.stringify(data.error) : "Request failed"
    );
  }
  return data as { reply: string; sessionId: string };
}
