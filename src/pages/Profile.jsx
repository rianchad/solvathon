import React from "react";
import Card from "../components/Card";
import { getItem, keys } from "../utils/storage";

function Profile() {
  const user = getItem(keys.currentUser);
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-3">
      <Card className="space-y-1">
        <div className="text-lg font-semibold text-slate-900">{user.name}</div>
        <div className="text-slate-700">Age: {user.age}</div>
        <div className="text-slate-700">Points: {user.points}</div>
        <div className="text-slate-700">Badges: {user.badges?.join(", ") || "None"}</div>
      </Card>
      <Card>
        <div className="font-semibold text-slate-900 mb-2">Completed Challenges</div>
        <ul className="list-disc ml-6 text-slate-700">
          {(user.completedChallenges || []).map((c) => <li key={c}>{c}</li>)}
        </ul>
      </Card>
    </div>
  );
}

export default Profile;
export { Profile };