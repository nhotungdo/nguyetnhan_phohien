"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface FireworksCelebrationProps {
  /** Khi true, kích hoạt chuỗi bắn pháo hoa */
  isActive: boolean;
  /** Thời lượng bắn pháo hoa (mili giây), mặc định 6000ms */
  duration?: number;
  /** Callback khi đợt bắn pháo hoa kết thúc */
  onClose?: () => void;
  /** Bật âm thanh tổng hợp Web Audio (mặc định true) */
  enableSound?: boolean;
}

// Bảng màu rực rỡ, may mắn, hoàng gia (Phố Hiến)
const COLOR_PALETTES = [
  // 1. Hoàng Kim Phố Hiến (Vàng Long Nhãn - Hổ Phách - Bạch Kim)
  ["#FFD700", "#F59E0B", "#FBBF24", "#FEF08A", "#FFFFFF", "#F97316"],
  // 2. Đại Cát Hồng Phúc (Đỏ Lễ Hội - Hồng Ngọc - Đỏ Nhung)
  ["#EF4444", "#DC2626", "#F43F5E", "#FDA4AF", "#FEE2E2", "#FF5964"],
  // 3. Ngọc Bích Thượng Uyển (Xanh Lục Bảo - Xanh Ngọc)
  ["#10B981", "#059669", "#34D399", "#6EE7B7", "#A7F3D0", "#38EF7D"],
  // 4. Hoàng Gia Quyến Rũ (Tím Sen - Ánh Hồng - Tím Kim)
  ["#A855F7", "#9333EA", "#C084FC", "#E9D5FF", "#F472B6", "#EC4899"],
  // 5. Ngũ Sắc Rực Rỡ (Pháo hoa tổng hợp)
  ["#FFD700", "#EF4444", "#10B981", "#3B82F6", "#A855F7", "#F97316", "#FFFFFF"],
];

interface Point {
  x: number;
  y: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  friction: number;
  flicker: boolean;
  flickerSpeed: number;
  flickerOffset: number;
  size: number;
  history: Point[];
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  palette: string[];
  burstType: "chrysanthemum" | "willow" | "ring" | "double" | "star";
  history: Point[];
  exploded: boolean;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotX: number;
  rotY: number;
  vRotX: number;
  vRotY: number;
  alpha: number;
  decay: number;
}

export function FireworksCelebration({
  isActive,
  duration = 6000,
  onClose,
  enableSound = true,
}: FireworksCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  const isMutedRef = useRef(!enableSound);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Khởi tạo audio context khi người dùng tương tác
  const getAudioContext = useCallback(() => {
    if (isMutedRef.current || typeof window === "undefined") return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Âm thanh vút phóng pháo hoa
  const playLaunchSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Bỏ qua lỗi audio
    }
  }, [getAudioContext]);

  // Âm thanh nổ pháo hoa
  const playExplosionSound = useCallback((isHeavy = false) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      
      // Tiếng đùng trầm
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(isHeavy ? 140 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + (isHeavy ? 0.45 : 0.3));

      gain.gain.setValueAtTime(isHeavy ? 0.12 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.5 : 0.35));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isHeavy ? 0.52 : 0.38));

      // Tiếng lẹt đẹt tí tách (Crackle noise)
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.03, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now + 0.04);
    } catch {
      // Bỏ qua lỗi audio
    }
  }, [getAudioContext]);

  useEffect(() => {
    isMutedRef.current = !enableSound;
  }, [enableSound]);

  useEffect(() => {
    if (!isActive) {
      setIsShowing(false);
      return;
    }

    setIsShowing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Tuân thủ quyền trợ năng: nếu người dùng bật giảm chuyển động, không bắn pháo hoa
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsShowing(false);
        onClose?.();
      }, 300);
      return () => clearTimeout(timer);
    }

    let animId = 0;
    let startTime = performance.now();
    let isEnding = false;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const confetti: ConfettiPiece[] = [];

    // Helper tạo quả pháo hoa
    const createRocket = (
      startX?: number,
      targetYPercent?: number,
      paletteChoice?: string[],
      forcedBurstType?: Rocket["burstType"]
    ) => {
      if (isEnding) return;
      const chosenPalette = paletteChoice || COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
      const x = (startX ?? (0.15 + Math.random() * 0.7) * width) * dpr;
      const y = height * dpr;
      const targetY = (targetYPercent ?? (0.15 + Math.random() * 0.4)) * height * dpr;

      const types: Rocket["burstType"][] = ["chrysanthemum", "willow", "ring", "double", "star"];
      const burstType = forcedBurstType || types[Math.floor(Math.random() * types.length)];

      const speedFactor = Math.sqrt((y - targetY) * 2 * 0.16 * dpr);
      const vy = -speedFactor;
      const vx = ((Math.random() - 0.5) * 1.8) * dpr;

      rockets.push({
        x,
        y,
        targetY,
        vx,
        vy,
        color: chosenPalette[0],
        palette: chosenPalette,
        burstType,
        history: [],
        exploded: false,
      });

      playLaunchSound();
    };

    // Tạo vụ nổ pháo hoa
    const explodeRocket = (rocket: Rocket) => {
      rocket.exploded = true;
      playExplosionSound(rocket.burstType === "willow" || rocket.burstType === "double");

      const particleCount = prefersReducedMotion
        ? 35
        : width < 640
        ? 65
        : rocket.burstType === "willow"
        ? 120
        : 95;

      const baseColor = rocket.palette;

      if (rocket.burstType === "ring") {
        // Nổ dạng vòng tròn đồng tâm
        const ringRadiusSpeed = (4.5 + Math.random() * 2.5) * dpr;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const speed = ringRadiusSpeed * (0.92 + Math.random() * 0.16);
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: baseColor[i % baseColor.length],
            alpha: 1,
            decay: 0.014 + Math.random() * 0.008,
            gravity: 0.045 * dpr,
            friction: 0.97,
            flicker: Math.random() > 0.4,
            flickerSpeed: 0.2 + Math.random() * 0.3,
            flickerOffset: Math.random() * 10,
            size: (2 + Math.random() * 2) * dpr,
            history: [],
          });
        }
      } else if (rocket.burstType === "double") {
        // Nổ hai tầng (vòng trong màu này, chùm ngoài màu khác)
        const innerColor = baseColor[0];
        const outerColor = baseColor[1] || "#FFFFFF";
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const isOuter = i % 2 === 0;
          const speed = ((isOuter ? 5.5 : 2.8) + Math.random() * 1.8) * dpr;
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: isOuter ? outerColor : innerColor,
            alpha: 1,
            decay: 0.015 + Math.random() * 0.01,
            gravity: 0.05 * dpr,
            friction: 0.965,
            flicker: true,
            flickerSpeed: 0.25,
            flickerOffset: Math.random() * 10,
            size: (2 + Math.random() * 2) * dpr,
            history: [],
          });
        }
      } else if (rocket.burstType === "willow") {
        // Liễu rủ vàng kim / hoàng gia: hạt bay chậm, rơi dài lấp lánh
        const golden = ["#FFD700", "#FBBF24", "#FEF08A", "#FFFFFF"];
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (1.5 + Math.random() * 5.2) * dpr;
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.8 * dpr,
            color: golden[Math.floor(Math.random() * golden.length)],
            alpha: 1,
            decay: 0.009 + Math.random() * 0.007,
            gravity: 0.038 * dpr,
            friction: 0.962,
            flicker: true,
            flickerSpeed: 0.18 + Math.random() * 0.2,
            flickerOffset: Math.random() * 10,
            size: (2.2 + Math.random() * 2) * dpr,
            history: [],
          });
        }
      } else {
        // Cúc hoa (Chrysanthemum): tán cầu đa hướng
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 6.5 + 1.5) * dpr;
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: baseColor[Math.floor(Math.random() * baseColor.length)],
            alpha: 1,
            decay: 0.014 + Math.random() * 0.012,
            gravity: 0.055 * dpr,
            friction: 0.965,
            flicker: Math.random() > 0.35,
            flickerSpeed: 0.2 + Math.random() * 0.3,
            flickerOffset: Math.random() * 10,
            size: (2 + Math.random() * 2.2) * dpr,
            history: [],
          });
        }
      }
    };

    // Bắn pháo giấy hoa (Confetti) từ 2 góc dưới màn hình
    const launchCornerConfetti = () => {
      if (prefersReducedMotion) return;
      const count = width < 640 ? 30 : 55;
      const colors = ["#FFD700", "#EF4444", "#10B981", "#3B82F6", "#A855F7", "#F59E0B"];

      // Góc trái dưới hướng lên phải
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.45;
        const speed = (9 + Math.random() * 10) * dpr;
        confetti.push({
          x: 0,
          y: height * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: (6 + Math.random() * 6) * dpr,
          h: (9 + Math.random() * 8) * dpr,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 0.2,
          vRotY: (Math.random() - 0.5) * 0.2,
          alpha: 1,
          decay: 0.007 + Math.random() * 0.005,
        });
      }

      // Góc phải dưới hướng lên trái
      for (let i = 0; i < count; i++) {
        const angle = (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.45;
        const speed = (9 + Math.random() * 10) * dpr;
        confetti.push({
          x: width * dpr,
          y: height * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: (6 + Math.random() * 6) * dpr,
          h: (9 + Math.random() * 8) * dpr,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 0.2,
          vRotY: (Math.random() - 0.5) * 0.2,
          alpha: 1,
          decay: 0.007 + Math.random() * 0.005,
        });
      }
    };

    // Chuỗi phóng pháo hoa định thời
    // 1. Ngay lập tức: 3 quả mở màn chào mừng + pháo hoa góc
    createRocket(width * 0.3, 0.25, COLOR_PALETTES[0], "chrysanthemum");
    createRocket(width * 0.5, 0.2, COLOR_PALETTES[1], "double");
    createRocket(width * 0.7, 0.28, COLOR_PALETTES[2], "willow");
    launchCornerConfetti();

    // 2. Lịch trình bắn tiếp theo theo nhịp điệu ấn tượng
    const timeouts: NodeJS.Timeout[] = [];
    const schedule = [
      { delay: 500, x: 0.25, y: 0.35, p: 3 },
      { delay: 900, x: 0.65, y: 0.22, p: 0 },
      { delay: 1400, x: 0.4, y: 0.28, p: 1 },
      { delay: 1800, x: 0.8, y: 0.32, p: 2 },
      { delay: 2200, x: 0.2, y: 0.2, p: 0 },
      { delay: 2700, x: 0.5, y: 0.3, p: 4 },
      // Đợt cao trào (Grand Finale): đồng loạt nổ rực sáng
      { delay: 3300, x: 0.2, y: 0.18, p: 0 },
      { delay: 3450, x: 0.4, y: 0.22, p: 1 },
      { delay: 3500, x: 0.6, y: 0.15, p: 2 },
      { delay: 3600, x: 0.8, y: 0.25, p: 3 },
      { delay: 3700, x: 0.5, y: 0.2, p: 4 },
    ];

    schedule.forEach((item) => {
      const t = setTimeout(() => {
        if (!isEnding) {
          createRocket(width * item.x, item.y, COLOR_PALETTES[item.p]);
          if (item.delay === 3300) {
            launchCornerConfetti();
          }
        }
      }, item.delay);
      timeouts.push(t);
    });

    // Sau duration: dừng phóng mới, chờ các hạt tàn dần rồi đóng
    const finishTimeout = setTimeout(() => {
      isEnding = true;
    }, duration);

    // Vòng lặp vẽ pháo hoa
    const render = (time: number) => {
      const elapsed = time - startTime;

      // Xóa canvas với hiệu ứng mờ kéo vệt (Motion Blur Trail)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width * dpr, height * dpr);
      ctx.restore();

      // Sử dụng chế độ hòa trộn 'lighter' để tạo hiệu ứng phát quang rực rỡ
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // 1. Cập nhật và vẽ Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > 7) r.history.shift();

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.12 * dpr; // Trọng lực nhẹ khi bay lên

        // Vẽ vệt đuôi tên lửa
        if (r.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(r.history[0].x, r.history[0].y);
          for (let h = 1; h < r.history.length; h++) {
            ctx.lineTo(r.history[h].x, r.history[h].y);
          }
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2.5 * dpr;
          ctx.stroke();
        }

        // Tia lửa nhỏ rơi ra từ đuôi rocket
        if (Math.random() > 0.4) {
          sparks.push({
            x: r.x,
            y: r.y,
            vx: (Math.random() - 0.5) * 1.5 * dpr,
            vy: Math.random() * 2 * dpr,
            color: "#FFF7ED",
            alpha: 0.8,
            decay: 0.05,
            gravity: 0.04 * dpr,
            friction: 0.95,
            flicker: false,
            flickerSpeed: 0,
            flickerOffset: 0,
            size: 1.5 * dpr,
            history: [],
          });
        }

        // Đạt đỉnh cao độ -> NỔ!
        if (r.vy >= -1.2 * dpr || r.y <= r.targetY) {
          explodeRocket(r);
          rockets.splice(i, 1);
        }
      }

      // 2. Cập nhật và vẽ các hạt tia lửa nổ (Sparks)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.history.push({ x: s.x, y: s.y });
        if (s.history.length > 4) s.history.shift();

        s.vx *= s.friction;
        s.vy *= s.friction;
        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        // Nhấp nháy lấp lánh
        let currentAlpha = s.alpha;
        if (s.flicker) {
          const wave = Math.sin((elapsed * 0.02 * s.flickerSpeed) + s.flickerOffset);
          currentAlpha = s.alpha * (wave > 0 ? 1 : 0.45);
        }

        // Vẽ vệt tia lửa
        if (s.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(s.history[0].x, s.history[0].y);
          for (let h = 1; h < s.history.length; h++) {
            ctx.lineTo(s.history[h].x, s.history[h].y);
          }
          ctx.strokeStyle = s.color;
          ctx.globalAlpha = Math.max(0, currentAlpha);
          ctx.lineWidth = s.size;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Đầu hạt tia sáng
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.fill();
      }

      ctx.restore();

      // 3. Cập nhật và vẽ pháo giấy (Confetti)
      ctx.save();
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.16 * dpr; // Trọng lực rơi
        c.vx *= 0.98;
        c.rotX += c.vRotX;
        c.rotY += c.vRotY;
        c.alpha -= c.decay;

        if (c.alpha <= 0 || c.y > height * dpr + 50) {
          confetti.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotX);
        ctx.scale(Math.cos(c.rotY), 1);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.alpha);
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
      ctx.restore();

      // Kiểm tra kết thúc hoàn toàn
      if (isEnding && rockets.length === 0 && sparks.length === 0 && confetti.length === 0) {
        ctx.clearRect(0, 0, width * dpr, height * dpr);
        setIsShowing(false);
        onClose?.();
        return;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
      timeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
      if (canvas) {
        const cleanupCtx = canvas.getContext("2d");
        cleanupCtx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [isActive, duration, onClose, playExplosionSound, playLaunchSound]);

  if (!isShowing && !isActive) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}

export default FireworksCelebration;
