"use client";

import { useState, useEffect } from "react";
import { contentApi } from "@/services/api.service";
import type { WebsiteContentResponse } from "@/types/api.types";

const defaultContents: Record<string, string> = {
  HeroTitle: "Đặc Sản Long Nhãn Phố Hiến",
  HeroSubtitle: "Hương vị truyền thống, đậm đà bản sắc Hưng Yên.",
  Hotline: "090 123 4567",
  Address: "Số 1, Phố Hiến, Hưng Yên",
  FooterText: "© 2026 Nguyệt Nhãn Phố Hiến. Tất cả các quyền được bảo lưu."
};

export function useWebsiteContent() {
  const [content, setContent] = useState<Record<string, string>>(defaultContents);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const data = await contentApi.getAll();
        const mapped = { ...defaultContents };
        data.forEach((item: WebsiteContentResponse) => {
          if (item.value) {
            mapped[item.key] = item.value;
          }
        });
        setContent(mapped);
      } catch (err) {
        console.warn("Failed to load website content:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, []);

  return { content, isLoading };
}
