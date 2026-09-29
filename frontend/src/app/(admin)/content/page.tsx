import ContentCMS from "@/views/content/ContentCMS";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Nội dung | Nguyệt Nhãn Phố Hiến",
};

export default function ContentPage() {
  return <ContentCMS />;
}
