import React from "react";
import Card from "../components/Card";

function Home() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to CivicConnect</h1>
        <p className="text-slate-700">
          A youth-focused hub for civic engagement. Explore posts, complete challenges,
          RSVP to local events, and track your impact.
        </p>
      </Card>
      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <div className="font-medium text-slate-900">Feed</div>
          <div className="text-sm text-slate-600">Read updates and share your voice.</div>
        </Card>
        <Card>
          <div className="font-medium text-slate-900">Challenges</div>
          <div className="text-sm text-slate-600">Earn points and badges as you engage.</div>
        </Card>
        <Card>
          <div className="font-medium text-slate-900">Events</div>
          <div className="text-sm text-slate-600">RSVP and get reminders for upcoming events.</div>
        </Card>
      </div>
    </div>
  );
}

export default Home;
export { Home };