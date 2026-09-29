import Orders from "@/views/orders/Orders";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Đơn hàng | Nguyệt Nhãn Phố Hiến",
};

export default function OrdersPage() {
  return <Orders />;
}
