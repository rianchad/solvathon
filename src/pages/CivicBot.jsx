import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import { getItem, keys, getSummary } from "../utils/storage";
import { askCivicBot, getOpenAICooldownSeconds, isOpenAIConfigured } from "../utils/api";

export default function CivicBot() {
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi! Ask me about events, volunteering, or posts." }]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCooldown(getOpenAICooldownSeconds());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const search = (q) => {
    const query = q.toLowerCase();

    const posts = (getItem(keys.posts) || []).filter(
      (p) => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query)
    );
    const events = (getItem(keys.events) || []).filter(
      (e) => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)
    );
    const challenges = (getItem(keys.challenges) || []).filter(
      (c) => c.title.toLowerCase().includes(query) || (c.description || "").toLowerCase().includes(query)
    );

    let domain = "general";
    if (query.includes("event")) domain = "events";
    if (query.includes("volunteer") || query.includes("challenge")) domain = "challenges";

    const pick = (arr, map) => (arr.length ? arr.slice(0, 3).map(map).join("\n") : "");

    if (domain === "events" && events.length) {
      return "Here are some events:\n" + pick(events, (e) => `• ${e.title} — ${new Date(e.date).toLocaleString()}`);
    }
    if (domain === "challenges" && challenges.length) {
      return "Here are some challenges:\n" + pick(challenges, (c) => `• ${c.title} — ${c.points} pts`);
    }
    if (posts.length || events.length || challenges.length) {
      const lines = [];
      if (posts.length) lines.push("Posts:\n" + pick(posts, (p) => `• ${p.title}: ${getSummary(p.content, 14)}`));
      if (events.length) lines.push("Events:\n" + pick(events, (e) => `• ${e.title} — ${new Date(e.date).toLocaleString()}`));
      if (challenges.length) lines.push("Challenges:\n" + pick(challenges, (c) => `• ${c.title} — ${c.points} pts`));
      return lines.join("\n\n");
    }
    return "Error: Couldn't access OpenAI servers. Please contact support.";
  };

  const buildContext = (q) => {
    const query = q.toLowerCase();
    const posts = (getItem(keys.posts) || []).filter(
      (p) => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query)
    );
    const events = (getItem(keys.events) || []).filter(
      (e) => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)
    );
    const challenges = (getItem(keys.challenges) || []).filter(
      (c) => c.title.toLowerCase().includes(query) || (c.description || "").toLowerCase().includes(query)
    );
    const pick = (arr, map) => (arr.length ? arr.slice(0, 3).map(map).join("\n") : "");
    const parts = [];
    if (posts.length) parts.push("Posts:\n" + pick(posts, (p) => `• ${p.title}: ${getSummary(p.content, 18)}`));
    if (events.length) parts.push("Events:\n" + pick(events, (e) => `• ${e.title} — ${new Date(e.date).toLocaleString()}`));
    if (challenges.length) parts.push("Challenges:\n" + pick(challenges, (c) => `• ${c.title} — ${c.points} pts`));
    return parts.join("\n\n");
  };

  const send = async () => {
    if (!text.trim() || loading) return;
    if (!isOpenAIConfigured()) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "CivicBot needs an API key. Add VITE_OPENAI_API_KEY to .env.local and restart the dev server." }
      ]);
      setText("");
      return;
    }
    const q = text.trim();
    setMessages((m) => [...m, { from: "you", text: q }]);
    setLoading(true);
    try {
      const context = buildContext(q);
      const userId = (getItem(keys.currentUser) || {}).id || "anon";
      const a = await askCivicBot(q, context, userId);
      setMessages((m) => [...m, { from: "bot", text: a }]);
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.includes("CivicBot is busy")) {
        const secs = getOpenAICooldownSeconds() || 5;
        setCooldown(secs);
        setMessages((m) => [
          ...m,
          { from: "bot", text: `I’m a bit busy right now. Please wait ~${secs}s and try again.` },
        ]);
      } else {
        // Fallback to local search for non-429 errors
        const a = search(q);
        setMessages((m) => [...m, { from: "bot", text: a }]);
      }
    } finally {
      setLoading(false);
    }
    setText("");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <Card className="h-[60vh] overflow-y-auto space-y-2">
        {messages.map((m, i) => {
          const lines = String(m.text || "").split("\n");
          return (
            <div
              key={i}
              className={`px-3 py-2 rounded-xl max-w-[80%] ${
                m.from === "you" ? "ml-auto bg-civic-blue text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {lines.map((line, j) => (
                <div key={j}>{line}</div>
              ))}
            </div>
          );
        })}
      </Card>
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about events or volunteering..."
          className="flex-1 px-3 py-2 rounded-xl border border-slate-300"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-civic-blue text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : cooldown > 0 ? `Queued (${cooldown}s)` : "Send"}
        </button>
      </div>
    </div>
  );
}
