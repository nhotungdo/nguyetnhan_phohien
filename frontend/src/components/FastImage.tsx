"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface FastImageProps {
  /** URL ảnh: cùng origin với API (/uploads/...), asset nội bộ (/logo.jpg) hoặc URL ngoài. */
  src: string;
  alt: string;
  className?: string;
  /** Ảnh dự phòng khi src bị 404 hoặc không tải được */
  fallbackSrc?: string;
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
 * Chuẩn hóa URL ảnh:
 *  - Giữ nguyên ảnh tĩnh nội bộ (/images/..., /logo.jpg)
 *  - Giữ nguyên link ngoài (http/https/data)
 *  - Chỉ ghép API_URL với ảnh tương đối từ backend (/uploads/...)
 */
export function resolveImageUrl(path?: string, fallback = "/images/setqua.jpg"): string {
  if (!path) return fallback;
  if (path.startsWith("/images/") || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
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
 * Ảnh tải nhanh và có khả năng tự phục hồi khi ảnh lỗi/404:
 *  - Tự động fallback sang fallbackSrc (mặc định /images/setqua.jpg) nếu link ảnh bị 404 hoặc mất kết nối backend.
 *  - Với ảnh cùng origin API → next/image (sharp) cắt ảnh về đúng kích thước hiển thị,
 *    chuyển AVIF/WebP và cache lại.
 *  - Với URL ngoài/data hoặc khi đã lỗi → dùng <img> trực tiếp để đảm bảo luôn tải được ảnh dự phòng.
 */
export function FastImage({
  src,
  alt,
  className,
  fallbackSrc = "/images/setqua.jpg",
  fill,
  width,
  height,
  priority,
  sizes,
  loading,
  onError,
}: FastImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    onError?.(e);
  };

  if (hasError || !canOptimize(currentSrc)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL ngoài/data: hoặc fallback an toàn
      <img
        src={currentSrc}
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
        src={currentSrc}
        alt={alt}
        className={className}
        fill
        priority={priority}
        sizes={sizes}
        loading={priority ? undefined : loading}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      width={width ?? 1}
      height={height ?? 1}
      priority={priority}
      sizes={sizes}
      loading={priority ? undefined : loading}
      onError={handleError}
    />
  );
}
