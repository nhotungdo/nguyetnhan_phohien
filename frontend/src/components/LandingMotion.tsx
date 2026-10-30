"use client";

/**
 * Bộ animation dùng chung cho landing page.
 *
 * Nguyên tắc:
 *  - Tôn trọng `prefers-reduced-motion`: người bật "giảm chuyển động" trong OS
 *    sẽ thấy nội dung hiện ngay (không trượt/zoom), tránh gây chóng mặt.
 *  - Mọi chuyển động chỉ dùng `transform` / `opacity` (không animate layout) để
 *    trình duyệt chạy trên GPU, không gây nhảy bố cục (CLS).
 */

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Đường cong "expo out": bật nhanh, dừng êm — cảm giác cao cấp hơn ease-out mặc định. */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Phần tử con: trượt lên + mờ dần nhẹ nhàng với khoảng dịch chuẩn mực. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
};

/** Phần tử con cao cấp: trượt lên + chuyển từ mờ ảo sang sắc nét (blur-to-focus). */
export const fadeUpBlur: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
};

/** Phần tử con: phóng nhẹ từ 0.95 → 1 (dùng cho thẻ, modal, ảnh). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: EASE_OUT_EXPO } },
};

/** Phần tử cha: tự động chạy lần lượt các con (stagger) với nhịp điệu êm ái. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/**
 * Hiệu ứng xuất hiện từng từ (Word Stagger Reveal) kèm độ mờ chuyển nét.
 * Đảm bảo các dòng tiêu đề xuất hiện sang trọng, đều đặn và không bị xô lệch layout.
 */
export function WordReveal({
  text,
  className = "",
  delay = 0,
  highlightWord,
  highlightClassName = "text-[#92400E] bg-gradient-to-r from-[#92400E] via-[#B45309] to-[#D97706] bg-clip-text text-transparent",
}: {
  text: string;
  className?: string;
  delay?: number;
  highlightWord?: string;
  highlightClassName?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ").filter(Boolean);

  if (reduce) {
    return (
      <span className={className}>
        {words.map((w, i) => {
          const isHighlight = highlightWord && w.toLowerCase().includes(highlightWord.toLowerCase());
          return (
            <span key={i} className={isHighlight ? highlightClassName : undefined}>
              {w}{i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, i) => {
        const isHighlight = highlightWord && word.toLowerCase().includes(highlightWord.toLowerCase());
        return (
          <motion.span
            key={`${word}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
              show: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.65, ease: EASE_OUT_EXPO },
              },
            }}
            className={`inline-block ${isHighlight ? highlightClassName : ""}`}
          >
            {word}{i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/** Khung xuất hiện khi cuộn tới (dùng cho tiêu đề, đoạn mô tả, khối nội dung). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/** Thanh tiến trình cuộn ở rất trên trang — lò xo mượt, không giật theo từng event scroll. */
export function ScrollProgressBar() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#B68A45]"
    />
  );
}

/**
 * Dải chữ chạy ngang (marquee) — nội dung lặp 2 lần rồi dịch đúng 50% nên vòng lặp liền mạch.
 * Rê chuột vào thì tạm dừng để người dùng đọc kịp.
 */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const reduce = useReducedMotion();
  const track = [...items, ...items];

  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      <div
        className={`flex w-max shrink-0 items-center ${reduce ? "" : "animate-marquee group-hover:[animation-play-state:paused]"}`}
      >
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            aria-hidden={i >= items.length}
            className="flex items-center gap-4 whitespace-nowrap px-7 text-xs font-bold uppercase tracking-[0.22em] md:text-sm"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
