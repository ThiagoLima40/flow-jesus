"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, Medal, Clock, Users } from "lucide-react";
import { Crown, Cross } from "@/components/ui/Graphics";
import type { Achievement } from "@/data/achievements";

const accentText = {
  pink: "text-brand-pink",
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
  white: "text-white",
} as const;

function Icon({ name, className }: { name: string; className: string }) {
  if (name === "trophy") return <Trophy className={className} />;
  if (name === "medal") return <Medal className={className} />;
  if (name === "clock") return <Clock className={className} />;
  if (name === "users") return <Users className={className} />;
  if (name === "crown") return <Crown className={className} />;
  return <Cross className={className} />;
}

export function AchievementCard({ item, index = 0 }: { item: Achievement; index?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 20 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="border border-white/10 bg-black/30 p-6 text-center transition-colors hover:border-white/25"
    >
      <Icon name={item.icon} className={`mx-auto h-8 w-8 ${accentText[item.accent]}`} />
      <p className={`mt-3 font-brush text-4xl ${accentText[item.accent]}`}>{item.value}</p>
      <p className="mt-1 font-display text-sm tracking-[0.15em] text-white">{item.label}</p>
      <p className="mt-1 text-xs text-white/50">{item.sub}</p>
    </motion.div>
  );
}
