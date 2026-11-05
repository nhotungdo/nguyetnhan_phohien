"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuth } from "@/services/api.service";

/**
 * Trạng thái xác thực khu quản trị.
 *
 * Chuyển về trang đăng nhập khi thiếu phiên quản trị hợp lệ.
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
        router.replace("/admin-login");
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  return { isAuthorized, isLoading };
}
