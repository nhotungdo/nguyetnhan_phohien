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
      pathname.startsWith("/orders") ||
      pathname.startsWith("/messenger") ||
      pathname.startsWith("/content") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/discounts") ||
      pathname.startsWith("/payment");

    if (isAdminRoute) return;

    // Tránh gửi lặp nhiều lần nếu component re-render cùng một đường dẫn trong 3 giây
    const now = Date.now();
    if (lastTrackedRef.current.path === pathname && now - lastTrackedRef.current.time < 3000) {
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
    });
  }, [pathname]);

  return null;
}
