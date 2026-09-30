import { Metadata } from "next";
import { DiscountManager } from "@/views/discounts/DiscountManager";

export const metadata: Metadata = {
  title: "Quản lý mã giảm giá | Nguyệt Nhãn Phố Hiến",
  description: "Trang quản lý mã giảm giá hệ thống",
};

export default function DiscountsPage() {
  return <DiscountManager />;
}
