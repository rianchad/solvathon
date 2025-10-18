import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home.jsx";
import Feed from "./pages/Feed.jsx";
import Challenges from "./pages/Challenges.jsx";
import Events from "./pages/Events.jsx";
import CivicBot from "./pages/CivicBot.jsx"; // keep default import
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getItem, keys } from "./utils/storage";
import TownHall from "./pages/TownHall";

export default function App() {
  const [adminMode, setAdminMode] = useState(() => getItem(keys.adminMode) || false);
  return (
    <div className="min-h-full">
      <NavBar adminMode={adminMode} setAdminMode={setAdminMode} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed adminMode={adminMode} />} />
        <Route path="/challenges" element={<Challenges adminMode={adminMode} />} />
        <Route path="/events" element={<Events adminMode={adminMode} />} />
        <Route path="/civicbot" element={<CivicBot />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/townhall" element={<TownHall />} />
      </Routes>
    </div>
  );
}