import type { ProductResponse } from "@/types/api.types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

export const resolveCmsImage = (url?: string) =>
  !url
    ? ""
    : url.startsWith("/images/") || /^(https?:)?\/\//i.test(url) || url.startsWith("data:")
      ? url
      : url.startsWith("/uploads/") || url.startsWith("uploads/")
        ? (url.startsWith("/") ? url : `/${url}`)
        : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

/**
 * Hàm chuẩn hóa ảnh đại diện chính của sản phẩm:
 * 1. Ưu tiên lấy từ bảng ProductImages (được sắp xếp theo displayOrder tăng dần)
 * 2. Dự phòng lấy từ thuộc tính imageUrl của sản phẩm
 * 3. Nếu không có ảnh nào, dùng ảnh tổng hợp bộ 3 sản phẩm chuẩn /images/combo3sp.jpg
 */
export function resolveProductPrimaryImage(prod?: ProductResponse | null): string {
  if (!prod) return "/images/combo3sp.jpg";

  if (prod.images && prod.images.length > 0) {
    const sorted = [...prod.images].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const primary = sorted[0]?.imagePath;
    if (primary) {
      return resolveCmsImage(primary);
    }
  }

  if (prod.imageUrl) {
    return resolveCmsImage(prod.imageUrl);
  }

  return "/images/combo3sp.jpg";
}


