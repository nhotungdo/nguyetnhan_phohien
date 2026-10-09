"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuth } from "@/services/api.service";

/**
 * Trạng thái xác thực khu quản trị.
 *
 * Khu quản trị KHÔNG còn hiện màn hình đăng nhập: token hết hạn/hiếu thì chuyển
 * về trang chủ ("/") — trước đây DashboardLayout render AdminLoginDialog chiếm
 * toàn màn hình ngay trên /dashboard (màn hình bị đánh giá là thừa thãi).
 * Lối đăng nhập duy nhất là trang riêng /admin-login.
 * Đây chỉ là lớp UX — mọi API quản trị vẫn yêu cầu JWT role Admin phía server.
 */
export function useAdminGuard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Bọc trong hàm (không setState trực tiếp trong effect — lint react-hooks/set-state-in-effect)
    const checkAuth = () => {
      if (!adminAuth.isLoggedIn()) {
        // replace (không phải push) để nút Back không quay lại vô hạn vào
        // khu quản trị rồi lại bị đá ra trang chủ.
        router.replace("/");
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  return { isAuthorized, isLoading };
}
