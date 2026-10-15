import type { MetadataRoute } from "next";
import { productApi } from "@/services/api.service";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Các trang tĩnh công khai chính
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/chinh-sach/giao-hang`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/chinh-sach/doi-tra`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/chinh-sach/kiem-dinh`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/chinh-sach/bao-mat`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Thử tải thêm danh sách sản phẩm từ API nếu backend đang chạy
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await productApi.getAllPublic();
    if (products && products.length > 0) {
      productRoutes = products.map((p) => ({
        url: `${BASE_URL}/#san-pham`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }
  } catch {
    // Nếu backend chưa chạy lúc build, sử dụng danh sách tĩnh an toàn
  }

  return [...staticRoutes, ...productRoutes.slice(0, 1)];
}
