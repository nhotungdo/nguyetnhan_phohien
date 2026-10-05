import type { NextConfig } from "next";

/**
 * Origin của API chứa ảnh upload (/uploads/products, /uploads/content).
 * next/image CHỈ kéo ảnh từ host nằm trong remotePatterns — thiếu host thì ảnh
 * báo lỗi ngay, nên phải liệt kê cả NEXT_PUBLIC_API_URL lẫn localhost (dev).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

type Pattern = { protocol: "http" | "https"; hostname: string; port?: string };

function toPattern(raw: string): Pattern | null {
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol === "https:" ? "https" : "http",
      hostname: url.hostname,
      // Bỏ trống port = khớp MỌI port (dev hay đổi cổng backend).
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const apiPattern = toPattern(API_URL);

// Dev: backend hay chạy ở localhost/127.0.0.1 với các cổng khác nhau.
const localPatterns: Pattern[] = [
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
];

const remotePatterns = [
  ...(apiPattern ? [apiPattern] : []),
  ...localPatterns,
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // Ảnh cắt sẵn dưới dạng AVIF/WebP — nhẹ hơn nhiều so với JPEG/PNG gốc
    // (backend cho phép upload file tới 5–10MB).
    formats: ["image/avif", "image/webp"],
    // Tên file upload luôn MỚI khi đổi ảnh (kèm Guid) nên cache 30 ngày an toàn:
    // lần xem sau trả từ cache của Next, không cần gọi lại backend.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next chặn kéo ảnh từ IP nội bộ/loopback (chống SSRF) → ảnh localhost/LAN
    // (192.168.x — môi trường dev & server trong mạng) sẽ bị từ chối với
    // "url parameter is not allowed". remotePatterns vẫn là whitelist thật,
    // chỉ gồm API_URL + localhost nên bật cờ này không mở rộng host được phép.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
