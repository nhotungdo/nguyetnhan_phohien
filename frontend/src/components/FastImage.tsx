"use client";

import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface FastImageProps {
  /** URL ảnh: cùng origin với API (/uploads/...), asset nội bộ (/logo.jpg) hoặc URL ngoài. */
  src: string;
  alt: string;
  className?: string;
  /** Đặt trong thẻ cha có position:relative (next/image tự inset-0). */
  fill?: boolean;
  /** Kích thước gốc khi KHÔNG dùng fill (vd thumbnail 56x56). */
  width?: number;
  height?: number;
  /** Tải trước (ảnh above-the-fold: hero, ảnh trong modal đang mở). */
  priority?: boolean;
  sizes?: string;
  loading?: "lazy" | "eager";
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * true nếu next/image có thể tối ưu được src.
 *  - cùng origin với API (đã khai trong remotePatterns) hoặc asset nội bộ "/" → optimize
 *  - URL host khác admin dán tay, data:, blob:, protocol-relative → KHÔNG optimize
 *    (next/image chặn host không có trong remotePatterns nên phải dùng <img> thường).
 */
function canOptimize(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("//")) return false;
  if (src.startsWith("/")) return true;
  try {
    return new URL(src).origin === new URL(API_URL).origin;
  } catch {
    return false;
  }
}

// Style "fill" của next/image — tái hiện y hệt cho nhánh <img> thường để
// ảnh URL ngoài không làm vỡ layout so với ảnh được optimize.
const FILL_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  width: "100%",
  color: "transparent",
};

/**
 * Ảnh tải nhanh:
 *  - Với ảnh cùng origin API → next/image (sharp) cắt ảnh về đúng kích thước hiển thị,
 *    chuyển AVIF/WebP và cache lại: ảnh gốc nhiều MB không còn bị tải nguyên con.
 *  - Với URL ngoài/data → giữ <img> như cũ (không lệch layout, không lỗi optimize).
 */
export function FastImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
  loading,
  onError,
}: FastImageProps) {
  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL ngoài/data: không thuộc remotePatterns nên next/image từ chối; giữ <img> thường.
      <img
        src={src}
        alt={alt}
        className={className}
        style={fill ? FILL_STYLE : undefined}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? "eager" : loading}
        decoding="async"
        onError={onError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill
        priority={priority}
        sizes={sizes}
        loading={priority ? undefined : loading}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width ?? 1}
      height={height ?? 1}
      priority={priority}
      sizes={sizes}
      loading={priority ? undefined : loading}
      onError={onError}
    />
  );
}
