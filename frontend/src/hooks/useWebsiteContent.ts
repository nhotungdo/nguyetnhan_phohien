"use client";

import { useQuery } from "@tanstack/react-query";
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
  const { data: content = defaultContents, isLoading } = useQuery({
    queryKey: ["website", "content"],
    queryFn: async () => {
      const data = await contentApi.getAll();
      const mapped = { ...defaultContents };
      data.forEach((item: WebsiteContentResponse) => {
        if (item.value) {
          mapped[item.key] = item.value;
        }
      });
      return mapped;
    },
  });

  return { content, isLoading };
}

