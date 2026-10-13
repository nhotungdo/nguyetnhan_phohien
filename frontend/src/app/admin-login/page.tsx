import { redirect } from "next/navigation";

/**
 * Trang /admin-login không còn được dùng.
 * Đăng nhập admin qua mã giảm giá "NguyetNhanPhoHienAdmin" trên trang chủ.
 */
export default function AdminLoginPage() {
  redirect("/");
}
