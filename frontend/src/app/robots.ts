import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nguyetnhan.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/chinh-sach/"],
        disallow: [
          "/admin-login",
          "/dashboard",
          "/dashboard/*",
          "/orders",
          "/orders/*",
          "/products",
          "/products/*",
          "/content",
          "/content/*",
          "/discounts",
          "/discounts/*",
          "/payment",
          "/payment/*",
          "/messenger",
          "/messenger/*",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
