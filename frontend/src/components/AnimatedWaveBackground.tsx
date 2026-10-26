"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const PARTICLES: Particle[] = [
  { id: 0, x: 12, y: 18, size: 2.5, duration: 8.5, delay: 0.5 },
  { id: 1, x: 84, y: 25, size: 3.8, duration: 10.2, delay: 1.8 },
  { id: 2, x: 45, y: 62, size: 1.8, duration: 6.8, delay: 2.1 },
  { id: 3, x: 28, y: 78, size: 4.2, duration: 9.4, delay: 0.2 },
  { id: 4, x: 67, y: 34, size: 2.1, duration: 7.6, delay: 1.4 },
  { id: 5, x: 91, y: 71, size: 3.2, duration: 10.8, delay: 2.7 },
  { id: 6, x: 19, y: 44, size: 1.9, duration: 8.1, delay: 0.9 },
  { id: 7, x: 53, y: 89, size: 4.0, duration: 6.4, delay: 1.1 },
  { id: 8, x: 76, y: 15, size: 2.7, duration: 9.9, delay: 2.3 },
  { id: 9, x: 38, y: 52, size: 3.5, duration: 7.2, delay: 0.7 },
  { id: 10, x: 8, y: 83, size: 1.6, duration: 10.5, delay: 1.6 },
  { id: 11, x: 62, y: 96, size: 4.4, duration: 8.9, delay: 2.9 },
  { id: 12, x: 95, y: 48, size: 2.3, duration: 7.8, delay: 0.4 },
  { id: 13, x: 33, y: 29, size: 3.1, duration: 9.1, delay: 1.9 },
  { id: 14, x: 50, y: 12, size: 2.0, duration: 6.9, delay: 2.5 },
  { id: 15, x: 82, y: 66, size: 3.6, duration: 10.1, delay: 1.2 },
];

export function AnimatedWaveBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseLeave = () => {
      setMousePos(null);
    };

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* 1. LỚP ĐÈN RỌI HOÀNG KIM THEO CON TRỎ CHUỘT (Interactive Cursor Spotlight) */}
      <div
        className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
        style={{
          background: mousePos
            ? `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.06) 45%, transparent 70%)`
            : "transparent",
          opacity: mousePos ? 1 : 0,
        }}
      />

      {/* 2. CÁC QUẦNG SÁNG AURORA VÀNG KIM CHUYỂN ĐỘNG CHẬM (Breathing Aura Orbs) */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 40, 0],
          y: [0, -25, 0],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/35 via-orange-500/20 to-transparent blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -35, 0],
          y: [0, 30, 0],
          opacity: [0.2, 0.38, 0.2],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-24 -left-16 w-96 h-96 rounded-full bg-gradient-to-tr from-orange-600/30 via-amber-600/20 to-emerald-950/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl"
      />

      {/* 3. LƯỚI CHẤM NHẠT TINH TẾ (Subtle Dot Matrix Grid) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#F59E0B 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* 4. SÓNG NƯỚC UỐN LƯỢN ĐA TẦNG (Fluid Animated Waves) */}
      {/* Sóng tầng 1: Sóng nền sâu uốn lượn chậm rãi */}
      <div className="absolute inset-x-0 bottom-0 h-60 sm:h-72 w-full overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="w-[200%] h-full flex"
        >
          <svg
            viewBox="0 0 1200 240"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="customMixWave1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#B45309" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#78350F" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 C150,140 350,20 500,80 C650,140 850,20 1000,80 C1100,120 1150,50 1200,80 L1200,240 L0,240 Z"
              fill="url(#customMixWave1)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 240"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <path
              d="M0,80 C150,140 350,20 500,80 C650,140 850,20 1000,80 C1100,120 1150,50 1200,80 L1200,240 L0,240 Z"
              fill="url(#customMixWave1)"
            />
          </svg>
        </motion.div>
      </div>

      {/* Sóng tầng 2: Dải lụa sóng vàng óng ánh nhấp nhô ngược chiều */}
      <div className="absolute inset-x-0 bottom-0 h-48 sm:h-56 w-full overflow-hidden">
        <motion.div
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
          className="w-[200%] h-full flex"
        >
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="customMixWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                <stop offset="45%" stopColor="#FBBF24" stopOpacity="0.28" />
                <stop offset="75%" stopColor="#D97706" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            <path
              d="M0,100 C200,30 400,160 600,100 C800,40 1000,150 1200,100 L1200,200 L0,200 Z"
              fill="url(#customMixWave2)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <path
              d="M0,100 C200,30 400,160 600,100 C800,40 1000,150 1200,100 L1200,200 L0,200 Z"
              fill="url(#customMixWave2)"
            />
          </svg>
        </motion.div>
      </div>

      {/* Sóng tầng 3: Sợi tơ vàng lấp lánh ở đỉnh sóng (Shimmering Crest Ribbon) */}
      <div className="absolute inset-x-0 bottom-0 h-40 sm:h-48 w-full overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
          className="w-[200%] h-full flex"
        >
          <svg
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="customMixWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="customMixWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.12" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,60 C250,110 450,10 700,70 C950,120 1100,20 1200,60"
              fill="none"
              stroke="url(#customMixWaveStroke)"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]"
            />
            <path
              d="M0,60 C250,110 450,10 700,70 C950,120 1100,20 1200,60 L1200,160 L0,160 Z"
              fill="url(#customMixWaveFill)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <path
              d="M0,60 C250,110 450,10 700,70 C950,120 1100,20 1200,60"
              fill="none"
              stroke="url(#customMixWaveStroke)"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]"
            />
            <path
              d="M0,60 C250,110 450,10 700,70 C950,120 1100,20 1200,60 L1200,160 L0,160 Z"
              fill="url(#customMixWaveFill)"
            />
          </svg>
        </motion.div>
      </div>

      {/* 5. CÁC HẠT BỤI VÀNG LƠ LỬNG NHẤP NHÁY (Floating Golden Dust Particles) */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-300 shadow-[0_0_8px_#F59E0B]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: [0, -32, 0],
            x: [0, p.id % 2 === 0 ? 12 : -12, 0],
            opacity: [0.15, 0.9, 0.15],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
