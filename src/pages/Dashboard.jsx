import React from "react";
import Card from "../components/Card";
import { getItem, keys } from "../utils/storage";
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts";

function Dashboard() {
  const posts = getItem(keys.posts) || [];
  const events = getItem(keys.events) || [];
  const users = getItem(keys.users) || [];

  const youth = users.filter((u) => (u.age || 0) <= 24);
  const youthParticipation = users.length ? Math.round((youth.filter((u) => (u.points || 0) > 0).length / users.length) * 100) : 0;
  const pointsData = users.map((u) => ({ name: u.name, points: u.points || 0 }));

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card><div className="text-slate-600 text-sm">Total Posts</div><div className="text-2xl font-semibold">{posts.length}</div></Card>
        <Card><div className="text-slate-600 text-sm">Total Events</div><div className="text-2xl font-semibold">{events.length}</div></Card>
        <Card><div className="text-slate-600 text-sm">Active Users</div><div className="text-2xl font-semibold">{users.length}</div></Card>
        <Card><div className="text-slate-600 text-sm">Youth Participation</div><div className="text-2xl font-semibold">{youthParticipation}%</div></Card>
      </div>
      <Card className="h-80">
        <div className="font-semibold text-slate-900 mb-2">Points by User</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pointsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="points" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export default Dashboard;
export { Dashboard };