const LS = {
  posts: "civic_posts",
  events: "civic_events",
  challenges: "civic_challenges",
  users: "civic_users",
  currentUser: "civic_current_user",
  adminMode: "civic_admin_mode"
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const demoPosts = [
  {
    id: uid(),
    title: "Community Park Cleanup Success",
    author: "Ava",
    date: new Date().toISOString(),
    content:
      "Over 30 volunteers gathered to clean Riverside Park. Collected 15 bags of trash. Next cleanup scheduled for next month. Join us!",
    upvotes: 12,
    comments: ["Amazing work!", "Count me in next time!"]
  },
  {
    id: uid(),
    title: "Town Hall Highlights: Youth Voices",
    author: "Liam",
    date: new Date(Date.now() - 86400000).toISOString(),
    content:
      "Students shared concerns about public transit and after-school programs. City council committed to pilot a new bus route.",
    upvotes: 8,
    comments: ["Great to see youth engagement!", "Looking forward to the new bus route."]
  }
];

const demoEvents = [
  {
    id: uid(),
    title: "Neighborhood Tree Planting",
    date: new Date(Date.now() + 5 * 86400000).toISOString(),
    description: "Help plant 50 trees along Maple Street. Tools provided.",
    attendees: []
  },
  {
    id: uid(),
    title: "School Board Meeting",
    date: new Date(Date.now() + 9 * 86400000).toISOString(),
    description: "Discuss curriculum updates and student initiatives.",
    attendees: []
  }
];

const demoChallenges = [
  { id: uid(), title: "Volunteer Cleanup", points: 50, description: "Join a local cleanup for an hour." },
  { id: uid(), title: "Attend a Town Hall", points: 40, description: "Attend and summarize key takeaways." },
  { id: uid(), title: "Share a Civic Post", points: 30, description: "Post about a local issue or event." }
];

const demoUsers = [
  { id: uid(), name: "You", age: 17, points: 120, completedChallenges: ["Volunteer Cleanup"], badges: ["Starter"] },
  { id: uid(), name: "Sam", age: 18, points: 95, completedChallenges: [], badges: ["Starter"] },
  { id: uid(), name: "Maya", age: 22, points: 160, completedChallenges: [], badges: ["Achiever"] }
];

export function seedIfEmpty() {
  if (!localStorage.getItem(LS.posts)) localStorage.setItem(LS.posts, JSON.stringify(demoPosts));
  if (!localStorage.getItem(LS.events)) localStorage.setItem(LS.events, JSON.stringify(demoEvents));
  if (!localStorage.getItem(LS.challenges)) localStorage.setItem(LS.challenges, JSON.stringify(demoChallenges));
  if (!localStorage.getItem(LS.users)) localStorage.setItem(LS.users, JSON.stringify(demoUsers));
  if (!localStorage.getItem(LS.currentUser)) localStorage.setItem(LS.currentUser, JSON.stringify(demoUsers[0]));
  if (!localStorage.getItem(LS.adminMode)) localStorage.setItem(LS.adminMode, JSON.stringify(false));
}

export function getItem(key) {
  return JSON.parse(localStorage.getItem(key));
}
export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const keys = LS;

export function getSummary(text, max = 26) {
  const words = text.split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

export function addBadgeForPoints(points) {
  if (points >= 200) return "Champion";
  if (points >= 150) return "Achiever";
  if (points >= 100) return "Contributor";
  return "Starter";
}

export function upsertUser(updated) {
  const users = getItem(LS.users) || [];
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx >= 0) users[idx] = updated;
  else users.push(updated);
  setItem(LS.users, users);
  setItem(LS.currentUser, updated);
}

export function addPost(post) {
  const posts = getItem(LS.posts) || [];
  posts.unshift({ ...post, id: uid(), upvotes: 0, comments: [] });
  setItem(LS.posts, posts);
}

export function addEvent(event) {
  const events = getItem(LS.events) || [];
  events.unshift({ ...event, id: uid(), attendees: [] });
  setItem(LS.events, events);
}

export function addChallenge(chal) {
  const challenges = getItem(LS.challenges) || [];
  challenges.unshift({ ...chal, id: uid() });
  setItem(LS.challenges, challenges);
}

// New: RSVP toggle for events
export function toggleEventRsvp(eventId, userId) {
  const events = getItem(LS.events) || [];
  const updated = events.map((e) => {
    if (e.id !== eventId) return e;
    const attendees = new Set(e.attendees || []);
    attendees.has(userId) ? attendees.delete(userId) : attendees.add(userId);
    return { ...e, attendees: Array.from(attendees) };
  });
  setItem(LS.events, updated);
}

// New: complete a challenge for a user (adds points and badge if upgraded)
export function completeChallengeForUser(userId, challengeId) {
  const users = getItem(keys.users) || [];
  const challenges = getItem(keys.challenges) || [];

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return;

  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) return;

  const user = users[userIndex];
  const completed = Array.isArray(user.completedChallenges) ? user.completedChallenges : [];

  // Prevent duplicates (support legacy storage by checking title or id)
  if (completed.includes(challenge.title) || completed.includes(challengeId)) return;

  user.completedChallenges = [...completed, challenge.title]; // store title; UI checks by title
  user.points = (Number(user.points) || 0) + (Number(challenge.points) || 0);

  users[userIndex] = user;
  setItem(keys.users, users);

  // Keep currentUser in sync
  const cur = getItem(keys.currentUser);
  if (cur && cur.id === userId) {
    setItem(keys.currentUser, user);
  }
}

// New: simple leaderboard (sorted by points desc)
export function getLeaderboard(limit = 10) {
  const users = getItem(LS.users) || [];
  return [...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, limit);
}