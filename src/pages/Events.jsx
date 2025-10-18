import React, { useMemo, useState } from "react";
import Card from "../components/Card";
import { addEvent, getItem, keys, toggleEventRsvp } from "../utils/storage";

function Events({ adminMode }) {
  const [events, setEvents] = useState(() => getItem(keys.events) || []);
  const user = getItem(keys.currentUser);
  const refresh = () => setEvents(getItem(keys.events) || []);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!title.trim() || !date || !desc.trim()) return;
    addEvent({ title: title.trim(), date: new Date(date).toISOString(), description: desc.trim() });
    setTitle(""); setDate(""); setDesc("");
    refresh();
  };

  const reminders = useMemo(() => {
    const now = Date.now();
    return (events || [])
      .filter((e) => (e.attendees || []).includes(user?.id))
      .map((e) => {
        const diffDays = Math.ceil((new Date(e.date).getTime() - now) / 86400000);
        return { id: e.id, title: e.title, days: diffDays };
      })
      .filter((r) => r.days >= 0)
      .sort((a, b) => a.days - b.days);
  }, [events, user?.id]);

  const toggle = (eventId) => {
    if (!user?.id) return;
    toggleEventRsvp(eventId, user.id);
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      {adminMode && (
        <Card className="space-y-2">
          <div className="font-semibold text-slate-900">Add Event</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
                 className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300" />
          <button onClick={submit} className="px-3 py-2 rounded-xl bg-civic-blue text-white">Add</button>
        </Card>
      )}

      {reminders.length > 0 && (
        <Card className="space-y-1">
          <div className="font-semibold text-slate-900">Upcoming Reminders</div>
          {reminders.map((r) => (
            <div key={r.id} className="text-sm text-slate-700">
              {r.title} in {r.days} day{r.days === 1 ? "" : "s"}
            </div>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        {events.map((e) => {
          const attending = (e.attendees || []).includes(user?.id);
          return (
            <Card key={e.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{e.title}</div>
                <div className="text-sm text-slate-600">{new Date(e.date).toLocaleString()}</div>
                <div className="text-slate-700">{e.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600 mb-2">{(e.attendees || []).length} going</div>
                <button
                  onClick={() => toggle(e.id)}
                  className={`px-3 py-2 rounded-xl ${attending ? "bg-slate-200 text-slate-700" : "bg-civic-blue text-white"}`}
                >
                  {attending ? "Cancel RSVP" : "RSVP"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Events;
export { Events };
