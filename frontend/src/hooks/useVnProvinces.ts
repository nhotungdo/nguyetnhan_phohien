"use client";

import { useRef, useState } from "react";
import { loadVnProvinces, type VnProvince } from "@/lib/vnAddress";

/**
 * Tải danh sách Tỉnh/Thành phố **theo yêu cầu** (lazy).
 *
 * Trang chủ là trang bán hàng: phần lớn khách chỉ xem sản phẩm, không đặt hàng.
 * Nạp sẵn dữ liệu 34 tỉnh + 3.321 phường/xã cho tất cả khách sẽ tốn băng thông
 * vô ích, nên chỉ tải khi khách thực sự chạm vào ô chọn địa điểm (`enable()`).
 *
 * Việc tải do HÀM XỬ LÝ SỰ KIỆN khởi động (không dùng useEffect): vừa tránh
 * thêm một vòng render khi vào trang, vừa tránh việc set state đồng bộ trong
 * effect — thứ dễ gây cascade render.
 */
export function useVnProvinces() {
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Đã bắt đầu tải chưa (tránh gọi trùng khi khách focus/click nhiều lần).
  const startedRef = useRef(false);

  const enable = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsLoading(true);
    setError(null);

    loadVnProvinces()
      .then((data) => {
        setProvinces(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu địa chỉ.");
        setIsLoading(false);
        // Cho phép thử lại ở lần chạm sau (vd lỗi mạng tạm thời).
        startedRef.current = false;
      });
  };

  return { provinces, isLoading, error, enable };
}
