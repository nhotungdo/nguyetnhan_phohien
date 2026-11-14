"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsApi } from "@/services/api.service";

const VISITOR_STORAGE_KEY = "nnph_visitor_id";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return "";
  }
}

function detectDevice(): string {
  if (typeof window === "undefined") return "Desktop";
  const w = window.innerWidth;
  if (w < 768) return "Mobile";
  if (w < 1024) return "Tablet";
  return "Desktop";
}

export function WebsiteTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef<{ path: string; time: number }>({ path: "", time: 0 });

  useEffect(() => {
    if (!pathname) return;

    // Không tracking các đường dẫn quản trị Admin
    const isAdminRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/messenger") ||
      pathname.startsWith("/content") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/discounts") ||
      pathname.startsWith("/payment");

    if (isAdminRoute) return;

    // Trong môi trường development (React StrictMode), effect chạy 2 lần trong < 400ms.
    // Ở production, mỗi lần người dùng truy cập hoặc tải lại trang đều được tính là 1 lượt truy cập.
    const now = Date.now();
    if (process.env.NODE_ENV === "development" && lastTrackedRef.current.path === pathname && now - lastTrackedRef.current.time < 400) {
      return;
    }
    lastTrackedRef.current = { path: pathname, time: now };

    const visitorId = getOrCreateVisitorId();
    const deviceType = detectDevice();
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    analyticsApi.trackVisit({
      path: pathname,
      visitorId,
      referrer,
      deviceType,
    }).catch(() => {
      // Bỏ qua lỗi ngầm nếu có sự cố mạng
    });
  }, [pathname]);

  return null;
}
