
import React from "react";
import { motion } from "framer-motion";

export default function Card({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`card p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}