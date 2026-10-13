import PaymentSettingsView from "@/views/payment/PaymentSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cấu hình thanh toán | Nguyệt Nhãn Phố Hiến",
};

export default function PaymentSettingsPage() {
  return <PaymentSettingsView />;
}
