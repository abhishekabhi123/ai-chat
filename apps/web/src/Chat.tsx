import { useEffect, useMemo, useRef, useState } from "react";
import { fetchHistory, sendMessage, type Sender } from "./api";
import "./style.css";

type ChatMsg = { sender: Sender; text: string };

const LS_KEY = "spur.sessionId";

const Chat = () => {
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    return localStorage.getItem(LS_KEY) || undefined;
  });
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => text.trim().length > 0 && !loading,
    [text, loading]
  );

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        setLoadError(null);
        const data = await fetchHistory(sessionId);
        setMessages(data.messages);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load history");
      }
    })();
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend() {
    const msg = text.trim();
    if (!msg || loading) return;

    setText("");
    setLoading(true);
    setMessages((m) => [...m, { sender: "user", text: msg }]);

    try {
      const res = await sendMessage(msg, sessionId);

      // persist sessionId in localStorage
      if (!sessionId || sessionId !== res.sessionId) {
        localStorage.setItem(LS_KEY, res.sessionId);
        setSessionId(res.sessionId);
      }

      setMessages((m) => [...m, { sender: "ai", text: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { sender: "ai", text: "Sorry—something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="chatCard">
        <div className="chatHeader">
          <div className="title">Spur Support (AI)</div>
          <div className="meta">
            {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "New session"}
          </div>
        </div>

        <div className="chatBody">
          {loadError ? <div className="error">{loadError}</div> : null}

          {messages.length === 0 ? (
            <div className="empty">
              Try: “What’s your return policy?” or “Do you ship to USA?”
            </div>
          ) : null}

          {messages.map((m, idx) => (
            <div key={idx} className={`msgRow ${m.sender}`}>
              <div className="msgBubble">{m.text}</div>
            </div>
          ))}

          {loading ? <div className="typing">Agent is typing…</div> : null}
          <div ref={bottomRef} />
        </div>

        <div className="chatFooter">
          <input
            className="input"
            value={text}
            placeholder="Type your message…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button className="sendBtn" disabled={!canSend} onClick={onSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
