import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Newspaper, Trophy, Calendar, Bot, User, Shield, Megaphone, BarChart2 } from "lucide-react";
import { getItem, keys, setItem } from "../utils/storage";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/feed", icon: Newspaper, label: "Feed" },
  { to: "/challenges", icon: Trophy, label: "Challenges" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/civicbot", icon: Bot, label: "CivicBot" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/dashboard", icon: BarChart2, label: "Dashboard" },
  { to: "/townhall", icon: Megaphone, label: "Town Hall" },
];

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition whitespace-nowrap ${
        isActive ? "text-civic-blue bg-slate-100" : "text-slate-700"
      }`
    }
  >
    {Icon && <Icon size={18} />}
    <span className="text-sm font-medium hidden md:inline">{label}</span>
  </NavLink>
);

export default function NavBar({ adminMode, setAdminMode }) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <Shield className="text-civic-blue" />
          <span className="font-semibold">CivicConnect</span>
        </motion.div>
        <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {links.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} />
          ))}
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-slate-600 hidden sm:inline">Admin Mode</span>
          <button
            onClick={() => {
              const next = !adminMode;
              setAdminMode(next);
              setItem(keys.adminMode, next);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              adminMode ? "bg-civic-blue" : "bg-slate-300"
            }`}
            aria-label="Toggle admin mode"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                adminMode ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}