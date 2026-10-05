import { contentApi } from "@/services/api.service";
import type { WebsiteContentResponse } from "@/types/api.types";

/**
 * Module KHÔNG có "use client" để cả server (SSR prefetch trong app/page.tsx)
 * lẫn client (useWebsiteContent) dùng chung MỘT query key + MỘT queryFn.
 * Để trong hook "use client" thì server chỉ nhận client reference và không gọi
 * được hàm; để mỗi nơi tự viết queryFn thì hydrate sai shape dữ liệu.
 */

export const defaultContents: Record<string, string> = {
  HeroTitle: "Đặc Sản Long Nhãn Phố Hiến",
  HeroSubtitle: "Hương vị truyền thống, đậm đà bản sắc Hưng Yên.",
  Hotline: "090 123 4567",
  Address: "Số 1, Phố Hiến, Hưng Yên",
  FooterText: "© 2026 Nguyệt Nhãn Phố Hiến. Tất cả các quyền được bảo lưu."
};

/** Query key dùng chung — PHẢI trùng với prefetch ở app/page.tsx (SSR). */
export const websiteContentQueryKey = ["website", "content"] as const;

/**
 * QueryFn dùng chung cho SSR prefetch (app/page.tsx) và hook useWebsiteContent.
 * Trả về OBJECT {Key: value} (không phải mảng gốc của API) — kiểu dữ liệu duy
 * nhất cho query key này, tránh hydrate nhầm làm Landing Page mất ảnh/text CMS.
 */
export async function fetchWebsiteContent(): Promise<Record<string, string>> {
  const data = await contentApi.getAll();
  const mapped = { ...defaultContents };
  // Ghi đè CẢ khi value rỗng: backend cho phép admin lưu chuỗi rỗng để xóa
  // nội dung, mà `if (item.value)` cũ bỏ qua giá trị rỗng nên nội dung
  // "đã xóa" luôn bị khôi phục về default. Khi API lỗi thì dữ liệu giữ nguyên
  // defaultContents (queryFn ném lỗi → React Query giữ data cũ).
  data.forEach((item: WebsiteContentResponse) => {
    mapped[item.key] = item.value ?? "";
  });
  return mapped;
}
