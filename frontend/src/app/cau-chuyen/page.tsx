import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { StoryPageView } from "@/views/story/StoryPageView";

export const metadata: Metadata = {
  title: "Ký Sự Long Nhãn Phố Hiến — Hương Vị Tiến Vua Khắc Họa Lịch Sử Hưng Yên",
  description:
    "Tìm hiểu cội nguồn di sản long nhãn Hưng Yên tiến vua từ thế kỷ 16, cây nhãn tổ Chùa Hiến 300 năm tuổi và tuyệt kỹ xoáy cùi sấy than củi nhãn truyền thống qua thước phim tài liệu di sản Phố Hiến.",
  openGraph: {
    title: "Ký Sự Long Nhãn Phố Hiến | Nguyệt Nhãn Phố Hiến",
    description:
      "Từ bãi bồi phù sa sông Hồng và cây nhãn tổ Chùa Hiến đến bàn tiệc ngự thiện cung đình. Khám phá câu chuyện di sản 300 năm lưu giữ hồn quê hương.",
    images: ["/images/combo3sp.jpg"],
  },
};

export default function CauChuyenPage() {
  return (
    <StorefrontLayout>
      <StoryPageView />
    </StorefrontLayout>
  );
}

