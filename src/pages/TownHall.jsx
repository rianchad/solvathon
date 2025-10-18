import React, { useState } from "react";
import Card from "../components/Card";
import { evaluateTownHall } from "../utils/api";
import { getItem, keys } from "../utils/storage";

function fallbackEvaluate(proposal) {
  const text = proposal || "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lengthScore = Math.max(2, Math.min(10, Math.floor(words.length / 25)));
  const hasGoal = /goal|aim|purpose|objective|solve|address/i.test(text) ? 2 : 0;
  const hasWho = /youth|students|residents|community|council|city|school/i.test(text) ? 2 : 0;
  const hasHow = /pilot|budget|timeline|partner|survey|workshop|outreach|measure/i.test(text) ? 2 : 0;

  const clarity = Math.min(10, lengthScore + hasGoal + (hasWho ? 1 : 0));
  const realism = Math.min(10, 3 + hasHow + (words.length > 80 ? 2 : 0));

  return [
    `Scores:`,
    `- Clarity: ${clarity}/10`,
    `- Realism: ${realism}/10`,
    ``,
    `Strengths:`,
    `- Identifies a community need.`,
    `- Action-oriented framing.`,
    ``,
    `Risks/Gaps:`,
    `- Add budget/timeline specifics.`,
    `- Specify stakeholders and success metrics.`,
    ``,
    `Feasibility (next 30 days):`,
    `1) Define a one-paragraph objective and 3 success metrics.`,
    `2) Identify 2 partners and set a kickoff meeting.`,
    `3) Run a small pilot or survey (n=25) and summarize findings.`,
    ``,
    `Key stakeholders: youth council, local org partners, school/city liaison, comms lead.`,
    ``,
    `30-second pitch:`,
    `We propose a focused pilot to address a clear youth need by partnering with local stakeholders,`,
    `testing a small-scale approach, and measuring impact with 3 simple metrics. This lets us learn fast,`,
    `optimize resources, and build community buy-in before scaling.`,
    ``,
    `Follow-up questions:`,
    `- What is the minimal budget and who owns each task?`,
    `- What would ‘success’ look like after 30 days?`,
  ].join("\n");
}

function buildTownHallContext(proposal) {
  const q = (proposal || "").toLowerCase();
  const eventsAll = (getItem(keys.events) || []);
  const challengesAll = (getItem(keys.challenges) || []);

  const match = (text) => (text || "").toLowerCase().includes(q);
  const eventsMatched = eventsAll.filter(e => match(e.title) || match(e.description));
  const challengesMatched = challengesAll.filter(c => match(c.title) || match(c.description));

  const events =
    (eventsMatched.length ? eventsMatched : eventsAll)
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);

  const challenges =
    (challengesMatched.length ? challengesMatched : challengesAll)
      .slice(0, 2);

  const ev = events.map(e => `• ${e.title} — ${new Date(e.date).toLocaleString()}`).join("\n");
  const ch = challenges.map(c => `• ${c.title} — ${c.points} pts`).join("\n");

  return [ev && `Events:\n${ev}`, ch && `Challenges:\n${ch}`].filter(Boolean).join("\n\n");
}

export default function TownHall() {
  const [proposal, setProposal] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const sample = `Create a monthly Youth Town Hall at the community center where teens propose ideas on transit safety and mental health. Partner with the school district and a local nonprofit. Start with a 3-month pilot: recruit 25 students, host 2 events, and publish a one-page summary for city council with next steps and a small budget request.`;

  const onEvaluate = async () => {
    if (!proposal.trim()) return;
    setLoading(true);
    setFeedback("");
    setNote("");
    try {
      const ctx = buildTownHallContext(proposal.trim());
      const resp = await evaluateTownHall(proposal.trim(), ctx);
      setFeedback(resp || "No response.");
    } catch (e) {
      setNote("Using offline evaluator (no API key or request failed).");
      setFeedback(fallbackEvaluate(proposal.trim()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <Card className="space-y-3">
        <div className="font-semibold text-slate-900">Youth Town Hall Simulator</div>
        <div className="text-sm text-slate-600">
          Draft your policy/idea. The AI evaluates clarity and realism and gives practice feedback.
        </div>
        <textarea
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          placeholder="Describe your idea: goal, who it helps, what you'll do, timeline, and how you'll measure success..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 min-h-[140px]"
        />
        <div className="flex gap-2">
          <button onClick={onEvaluate} disabled={loading} className="px-3 py-2 rounded-xl bg-civic-blue text-white disabled:opacity-60">
            {loading ? "Evaluating..." : "Evaluate"}
          </button>
          <button onClick={() => setProposal(sample)} disabled={loading} className="px-3 py-2 rounded-xl border border-slate-300">
            Use sample
          </button>
        </div>
        {note && <div className="text-xs text-amber-700">{note}</div>}
      </Card>

      {feedback && (
        <Card className="whitespace-pre-wrap">
          {feedback}
        </Card>
      )}
    </div>
  );
}