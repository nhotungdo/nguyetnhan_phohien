"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(false);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  };

  const start = useCallback(() => {
    clearTimers();
    activeRef.current = true;
    setVisible(true);
    setProgress(20);

    // Tăng dần tiến trình theo đường cong giảm tốc
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 86) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 86;
        }
        const remaining = 90 - prev;
        const step = Math.max(1, remaining * 0.18);
        return Math.min(86, prev + step);
      });
    }, 100);
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    if (!activeRef.current) return;
    activeRef.current = false;
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      finishTimerRef.current = setTimeout(() => {
        setProgress(0);
      }, 300);
    }, 220);
  }, []);

  // Khi pathname hoặc searchParams thay đổi: hoàn tất tiến trình và cuộn lên đầu trang mượt mà
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    if (activeRef.current) {
      finish();
    }
  }, [pathname, searchParams, finish]);

  // Lắng nghe click vào thẻ <a> nội bộ để bật thanh tiến trình ngay lập tức (0ms phản hồi)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Bỏ qua click chuột phải hoặc khi giữ phím Ctrl/Cmd/Shift/Alt
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target || !(target instanceof HTMLAnchorElement)) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Bỏ qua link ngoài, mailto, tel, tải file, mở tab mới hoặc neo hash nội bộ
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      try {
        const nextUrl = new URL(target.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Chỉ xử lý link cùng domain
        if (nextUrl.origin !== currentUrl.origin) return;

        // Nếu chỉ nhảy hash trong cùng trang thì bỏ qua
        if (
          nextUrl.pathname === currentUrl.pathname &&
          nextUrl.search === currentUrl.search &&
          nextUrl.hash
        ) {
          return;
        }

        // Nếu sang route hoặc query khác, khởi động thanh loading ngay lập tức
        if (
          nextUrl.pathname !== currentUrl.pathname ||
          nextUrl.search !== currentUrl.search
        ) {
          start();
        }
      } catch {
        // URL không hợp lệ thì bỏ qua
      }
    };

    const handlePopState = () => {
      start();
    };

    const handleCustomNavigationStart = () => {
      start();
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("app:navigation-start", handleCustomNavigationStart);

    return () => {
      clearTimers();
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("app:navigation-start", handleCustomNavigationStart);
    };
  }, [start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-[3px] bg-gradient-to-r from-[#23452F] via-[#B68A45] to-[#D5B477] relative shadow-[0_1px_10px_rgba(182,138,69,0.45)] transition-[width] duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      >
        {/* Điểm sáng đầu thanh dẫn dắt thị giác */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-[#FDE68A]/60 to-white shadow-[0_0_12px_#B68A45,0_0_6px_#FFF] rounded-full" />
      </div>
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}

/**
 * Kích hoạt thanh tiến trình cho các lệnh chuyển trang thủ công (router.push)
 */
export function triggerPageNavigation() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:navigation-start"));
  }
}
