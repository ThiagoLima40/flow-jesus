"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

type Dir = "up" | "left" | "right" | "none";

const offset: Record<Dir, { x?: number; y?: number }> = {
  up: { y: 26 },
  left: { x: -26 },
  right: { x: 26 },
  none: {},
};

/** Wrapper de entrada em scroll — respeita prefers-reduced-motion. */
export function Reveal({
  children,
  dir = "up",
  delay = 0,
  className = "",
  once = true,
}: {
  children: ReactNode;
  dir?: Dir;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset[dir] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
