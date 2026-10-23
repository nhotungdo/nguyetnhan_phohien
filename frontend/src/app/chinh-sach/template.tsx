"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export default function PolicyTemplate({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1], // easeOutQuint
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
