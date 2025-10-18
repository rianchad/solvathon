import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import { addChallenge, completeChallengeForUser, getItem, getLeaderboard, keys } from "../utils/storage";

export default function Challenges({ adminMode }) {
  const [challenges, setChallenges] = useState(() => getItem(keys.challenges) || []);
  const [user, setUser] = useState(() => getItem(keys.currentUser));
  const refresh = () => {
    setChallenges(getItem(keys.challenges) || []);
    setUser(getItem(keys.currentUser));
  };

  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(20);
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!title.trim() || !desc.trim()) return;
    addChallenge({ title: title.trim(), points: Number(points) || 0, description: desc.trim() });
    setTitle(""); setPoints(20); setDesc("");
    setChallenges(getItem(keys.challenges) || []);
  };

  const leaderboard = useMemo(() => getLeaderboard(5), [user, challenges]);

  const complete = (id) => {
    completeChallengeForUser(user.id, id);
    refresh();
  };

  const isDone = (name) => (user?.completedChallenges || []).includes(name);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {adminMode && (
        <Card className="space-y-2">
          <div className="font-semibold text-slate-900">Add Challenge</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Points"
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-civic-blue text-white">Add</button>
        </Card>
      )}

      <div className="space-y-3">
        {challenges.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{c.title}</div>
              <div className="text-sm text-slate-600">{c.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-civic-blue">{c.points} pts</span>
              <button
                onClick={() => complete(c.id)}
                disabled={isDone(c.title)}
                className={`px-3 py-2 rounded-xl ${isDone(c.title) ? "bg-slate-200 text-slate-500" : "bg-civic-blue text-white"}`}
              >
                {isDone(c.title) ? "Completed" : "Complete"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-2">
        <div className="font-semibold text-slate-900">Leaderboard</div>
        <div className="space-y-1">
          {leaderboard.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between">
              <span className="text-slate-700">{i + 1}. {u.name}</span>
              <span className="text-slate-900 font-medium">{u.points} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}