import { redirect } from "next/navigation";

/**
 * Trang /admin-login không còn được dùng.
 * Đăng nhập admin bằng mã quản trị trên trang chủ.
 */
export default function AdminLoginPage() {
  redirect("/");
}
